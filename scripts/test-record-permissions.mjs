import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';

// Real PostgreSQL RLS against every tracked migration. Only the Supabase-managed
// auth/storage schemas are fixtures; no network, production users, or credentials.
const db = await PGlite.create({ extensions: { uuid_ossp } });
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const owner = id(1),
  member = id(2),
  admin = id(3),
  contractor = id(4),
  outsider = id(5);
const property = id(10),
  area = id(20),
  otherArea = id(21),
  note = id(30),
  access = id(40);
const asUser = async (user) => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
    user,
  ]);
  await db.exec('set role authenticated');
};
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as
      $$ select current_user::text $$;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean);
    create table storage.objects(id uuid default gen_random_uuid() primary key, bucket_id text, name text, owner uuid);
    alter table storage.objects enable row level security;
    grant usage on schema public, auth, storage to authenticated, anon;
  `);
  const directory = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(directory))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    try {
      await db.exec(await readFile(new URL(file, directory), 'utf8'));
    } catch (error) {
      throw new Error(`Migration ${file}: ${error.message}`, { cause: error });
    }
  }
  await db.exec(
    'grant select, insert, update, delete on all tables in schema public, storage to authenticated, anon',
  );
  for (const user of [owner, member, admin, contractor, outsider])
    await db.query('insert into auth.users values ($1)', [user]);
  await db.query(
    'insert into properties (id, name, user_id) values ($1, $2, $3)',
    [property, 'Test home', owner],
  );
  for (const value of [area, otherArea])
    await db.query(
      'insert into areas(id, name, property_id) values ($1, $2, $3)',
      [value, 'Test room', property],
    );
  await db.query('insert into notes(id, title, area_id) values ($1, $2, $3)', [
    note,
    'Owner note',
    area,
  ]);
  for (const [user, role] of [
    [member, 'member'],
    [admin, 'admin'],
  ]) {
    await db.query(
      'insert into property_collaborators(property_id, user_id, role) values ($1, $2, $3)',
      [property, user, role],
    );
  }
  await db.query(
    'insert into contractor_area_access(id, area_id, owner_user_id, contractor_user_id, contractor_email) values ($1,$2,$3,$4,$5)',
    [access, area, owner, contractor, 'contractor@example.invalid'],
  );
  for (const value of [area, otherArea])
    await db.query(
      'insert into storage.objects(bucket_id,name,owner) values ($1,$2,$3)',
      ['images', `notes/${value}/test.jpg`, owner],
    );
  const visible = async (table) =>
    (await db.query(`select count(*)::int as count from ${table}`)).rows[0]
      .count;
  for (const user of [owner, member, admin]) {
    await asUser(user);
    assert.equal(await visible('areas'), 2);
    assert.equal(
      (
        await db.query('select count(*)::int as count from notes where id=$1', [
          note,
        ])
      ).rows[0].count,
      1,
    );
    assert.equal(await visible('storage.objects'), 2);
    const rowId = id(100 + Number(user.slice(-1)));
    for (let retry = 0; retry < 2; retry++) {
      await db.query(
        'insert into notes(id,title,area_id) values ($1,$2,$3) on conflict(id) do update set title=excluded.title, area_id=excluded.area_id',
        [rowId, 'Retry saved note', area],
      );
    }
    assert.equal(
      (
        await db.query('select count(*)::int as count from notes where id=$1', [
          rowId,
        ])
      ).rows[0].count,
      1,
    );
  }
  await asUser(member);
  assert.equal(
    (
      await db.query('update properties set name=$1 where id=$2 returning id', [
        'Blocked rename',
        property,
      ])
    ).rows.length,
    0,
    'member cannot administer property',
  );
  await asUser(admin);
  assert.equal(
    (
      await db.query('update properties set name=$1 where id=$2 returning id', [
        'Admin rename',
        property,
      ])
    ).rows.length,
    1,
  );
  await asUser(owner);
  // An interrupted creation retries the same id; property triggers and RLS must permit it.
  for (let retry = 0; retry < 2; retry++) {
    try {
      await db.query(
        'insert into properties(id,name,user_id) values ($1,$2,$3)',
        [id(11), 'Retry home', owner],
      );
    } catch (error) {
      assert.equal(error.code, '23505');
      assert.equal(
        (
          await db.query(
            'update properties set name=$1 where id=$2 returning id',
            ['Retry home', id(11)],
          )
        ).rows.length,
        1,
      );
    }
    await db.query(
      'insert into areas(id,name,property_id) values ($1,$2,$3) on conflict(id) do update set name=excluded.name,property_id=excluded.property_id',
      [id(22), 'Retry area', id(11)],
    );
  }
  assert.equal(
    (
      await db.query(
        'select count(*)::int as count from properties where id=$1',
        [id(11)],
      )
    ).rows[0].count,
    1,
  );
  assert.equal(
    (
      await db.query('select count(*)::int as count from areas where id=$1', [
        id(22),
      ])
    ).rows[0].count,
    1,
  );
  await asUser(contractor);
  assert.equal(await visible('areas'), 1, 'contractor sees assigned area only');
  assert.equal(
    await visible('storage.objects'),
    1,
    'contractor sees assigned images only',
  );
  await assert.rejects(
    db.query('insert into notes(title,area_id) values ($1,$2)', [
      'Cross-area attempt',
      otherArea,
    ]),
    { code: '42501' },
  );
  for (let retry = 0; retry < 2; retry++) {
    await db.query(
      "insert into notes(id,title,area_id,note_source,contractor_user_id,contractor_area_access_id) values ($1,$2,$3,'contractor',$4,$5) on conflict(id) do update set title=excluded.title,area_id=excluded.area_id,note_source=excluded.note_source,contractor_user_id=excluded.contractor_user_id,contractor_area_access_id=excluded.contractor_area_access_id",
      [id(104), 'Contractor work', area, contractor, access],
    );
  }
  assert.equal(
    (
      await db.query('select count(*)::int as count from notes where id=$1', [
        id(104),
      ])
    ).rows[0].count,
    1,
  );
  assert.equal(
    (
      await db.query('update notes set title=$1 where id=$2 returning id', [
        'Blocked edit',
        note,
      ])
    ).rows.length,
    0,
  );
  await asUser(outsider);
  for (const table of ['properties', 'areas', 'notes', 'storage.objects'])
    assert.equal(await visible(table), 0, `${table} private to unrelated user`);
  await db.exec('reset role');
  await db.query(
    "update contractor_area_access set status='revoked' where id=$1",
    [access],
  );
  await db.query(
    "update property_collaborators set status='revoked' where user_id=$1",
    [member],
  );
  for (const user of [contractor, member]) {
    await asUser(user);
    for (const table of ['properties', 'areas', 'notes', 'storage.objects'])
      assert.equal(
        await visible(table),
        0,
        `${table} inaccessible after revocation`,
      );
  }
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
  await db.exec('set role anon');
  for (const table of ['properties', 'areas', 'notes', 'storage.objects'])
    assert.equal(
      await visible(table),
      0,
      `${table} private to anonymous client`,
    );
  console.log(
    'Record permissions passed: owners, members, admins, contractors, unrelated/anonymous users, revocation, scoped images, and retry upserts.',
  );
} finally {
  await db.close();
}
