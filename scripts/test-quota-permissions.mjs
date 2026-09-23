import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Real Postgres ACL/function behavior in an isolated, in-memory database.
// This never connects to Supabase or reads production credentials.
const db = await PGlite.create();
const migrations = new URL('../supabase/migrations/', import.meta.url);
const original = await readFile(
  new URL('20260720000002_harden_property_access.sql', migrations),
  'utf8',
);
const repair = await readFile(
  new URL('20260916154854_restrict_ai_quota_execution.sql', migrations),
  'utf8',
);
const userId = '00000000-0000-4000-8000-000000000001';
const call = 'select * from public.consume_ai_plan_call($1, $2, $3)';
try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create role future_client_role;
    grant usage on schema public to public;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as 'select null::uuid';
    insert into auth.users values ('${userId}');
  `);
  await db.exec(
    original.slice(
      original.indexOf('create table if not exists public.user_usage'),
    ),
  );
  const privilege = async (role) =>
    (
      await db.query(
        "select has_function_privilege($1, 'public.consume_ai_plan_call(uuid,date,integer)', 'EXECUTE') as allowed",
        [role],
      )
    ).rows[0].allowed;
  assert.equal(
    await privilege('anon'),
    true,
    'fixture reproduces the original public grant',
  );
  assert.equal(await privilege('authenticated'), true);
  await db.exec(repair);
  await db.exec(repair); // Safe migration replay must preserve the repair.
  for (const role of ['anon', 'authenticated', 'future_client_role']) {
    assert.equal(
      await privilege(role),
      false,
      `${role} must not consume quota`,
    );
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query(call, [userId, '2026-09-01', 999999]), {
      code: '42501',
    });
    await db.exec('reset role');
  }
  assert.equal(
    (await db.query('select count(*)::int as count from public.user_usage'))
      .rows[0].count,
    0,
  );
  assert.equal(await privilege('service_role'), true);
  await db.exec('set role service_role');
  assert.deepEqual((await db.query(call, [userId, '2026-09-01', 2])).rows, [
    { allowed: true, used: 1, monthly_limit: 2 },
  ]);
  assert.deepEqual((await db.query(call, [userId, '2026-09-01', 2])).rows, [
    { allowed: true, used: 2, monthly_limit: 2 },
  ]);
  assert.deepEqual((await db.query(call, [userId, '2026-09-01', 2])).rows, [
    { allowed: false, used: 2, monthly_limit: 2 },
  ]);
  assert.deepEqual((await db.query(call, [userId, '2026-10-01', 2])).rows, [
    { allowed: true, used: 1, monthly_limit: 2 },
  ]);
  console.log(
    'Quota permissions passed: clients denied without writes; service quota and monthly reset preserved.',
  );
} finally {
  await db.close();
}
