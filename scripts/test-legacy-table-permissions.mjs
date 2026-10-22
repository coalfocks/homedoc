import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(
  new URL(
    '../supabase/migrations/20261021224500_secure_unused_legacy_tables.sql',
    import.meta.url,
  ),
  'utf8',
);
const legacyTables = ['user', 'note', 'area', 'property'];

async function fixture({
  includeLegacy = true,
  legacyRow = false,
  legacyPolicy = false,
} = {}) {
  const db = await PGlite.create();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id integer primary key);

    create table public.properties(id integer primary key, name text not null);
    create table public.areas(id integer primary key, property_id integer references public.properties);
    create table public.notes(id integer primary key, area_id integer references public.areas);
    create table public.todos(id integer primary key, area_id integer references public.areas);

    grant usage on schema public to anon, authenticated, service_role;
    grant all privileges on all tables in schema public to anon, authenticated, service_role;
    insert into public.properties values (1, 'Existing app property');
    insert into public.areas values (1, 1);
    insert into public.notes values (1, 1);
    insert into public.todos values (1, 1);
  `);

  if (includeLegacy) {
    await db.exec(`
      create table public."user"(
        id integer primary key,
        auth_user_id integer references auth.users(id)
      );
      create table public.property(
        id integer primary key,
        user_id integer references public."user"(id)
      );
      create table public.area(
        id integer primary key,
        property_id integer references public.property(id)
      );
      create table public.note(
        id integer primary key,
        area_id integer references public.area(id)
      );
      grant all privileges on all tables in schema public to anon, authenticated;
      grant all privileges on table
        public."user", public.note, public.area, public.property
        to PUBLIC;
    `);
    if (legacyRow) await db.exec('insert into public."user" values (1, null)');
    if (legacyPolicy) {
      await db.exec(
        'create policy legacy_note_policy on public.note for select using (true)',
      );
    }
  }

  return db;
}

const rlsEnabled = async (db, table) =>
  (
    await db.query(
      `select relrowsecurity as enabled from pg_catalog.pg_class where oid = to_regclass($1)`,
      [`public.${table === 'user' ? '"user"' : table}`],
    )
  ).rows[0]?.enabled ?? false;

const canSelect = (db, role, table) =>
  db.query('select has_table_privilege($1, $2, $3) as allowed', [
    role,
    `public.${table === 'user' ? '"user"' : table}`,
    'SELECT',
  ]);

try {
  {
    const db = await fixture();
    try {
      await db.exec('begin');
      await db.exec(migration);
      const heldLocks = await db.query(`
        select count(*)::int as count
        from pg_catalog.pg_locks locks
        join pg_catalog.pg_class relations on relations.oid = locks.relation
        where locks.locktype = 'relation'
          and locks.mode = 'AccessExclusiveLock'
          and locks.granted
          and relations.relnamespace = 'public'::regnamespace
          and relations.relname in ('user', 'note', 'area', 'property')
      `);
      assert.equal(
        heldLocks.rows[0].count,
        4,
        'all preflighted tables remain locked until the transaction ends',
      );
      await db.exec('commit');

      for (const table of legacyTables) {
        assert.equal(
          await rlsEnabled(db, table),
          true,
          `${table} has RLS enabled`,
        );
        for (const role of ['anon', 'authenticated']) {
          for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
            const result = await db.query(
              'select has_table_privilege($1, $2, $3) as allowed',
              [
                role,
                `public.${table === 'user' ? '"user"' : table}`,
                privilege,
              ],
            );
            assert.equal(
              result.rows[0].allowed,
              false,
              `${role} should not retain ${privilege} on ${table}`,
            );
          }
        }
        for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
          const result = await db.query(
            'select has_table_privilege($1, $2, $3) as allowed',
            [
              'service_role',
              `public.${table === 'user' ? '"user"' : table}`,
              privilege,
            ],
          );
          assert.equal(
            result.rows[0].allowed,
            true,
            `service_role ${privilege} access to ${table} is preserved`,
          );
        }
      }

      for (const role of ['anon', 'authenticated']) {
        await db.exec(`set role ${role}`);
        await assert.rejects(db.query('select * from public."user"'), {
          code: '42501',
        });
        await assert.rejects(
          db.query('insert into public."user" values (2, null)'),
          {
            code: '42501',
          },
        );
        await db.exec('reset role');
      }

      await db.exec('set role service_role');
      assert.deepEqual(
        (await db.query('select id from public."user"')).rows,
        [],
        'service role can still reach the empty table',
      );
      await db.exec('reset role');

      assert.deepEqual(
        (
          await db.query(`
            select
              (select count(*)::int from public.properties) as properties,
              (select count(*)::int from public.areas) as areas,
              (select count(*)::int from public.notes) as notes,
              (select count(*)::int from public.todos) as todos
          `)
        ).rows[0],
        { properties: 1, areas: 1, notes: 1, todos: 1 },
        'plural app-table data is unchanged',
      );
      assert.equal(await rlsEnabled(db, 'property'), true);
      assert.equal(await rlsEnabled(db, 'properties'), false);
      assert.equal(
        (await canSelect(db, 'authenticated', 'properties')).rows[0].allowed,
        true,
        'plural app-table grants are unchanged',
      );
    } finally {
      await db.close();
    }
  }

  for (const options of [{ legacyRow: true }, { legacyPolicy: true }]) {
    const db = await fixture(options);
    try {
      await assert.rejects(db.exec(migration));
      for (const table of legacyTables) {
        assert.equal(
          await rlsEnabled(db, table),
          false,
          'preflight failure leaves every legacy table unchanged',
        );
        assert.equal(
          (await canSelect(db, 'anon', table)).rows[0].allowed,
          true,
          'preflight failure rolls back earlier privilege changes',
        );
      }
    } finally {
      await db.close();
    }
  }

  {
    const db = await fixture({ includeLegacy: false });
    try {
      await db.exec(migration);
      assert.equal(await rlsEnabled(db, 'properties'), false);
      assert.equal(
        (await db.query('select count(*)::int as count from public.properties'))
          .rows[0].count,
        1,
      );
    } finally {
      await db.close();
    }
  }

  console.log(
    'Legacy table permission checks passed: empty unused tables are denied to client roles, service access and plural app data remain intact, nonempty/policy-bearing tables fail without partial changes, and absent tables are skipped.',
  );
} finally {
  // Individual fixture databases close in their own finally blocks.
}
