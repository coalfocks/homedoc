import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Exercises the billing migration with real PostgreSQL roles and RLS in memory.
// It does not connect to Supabase or read production credentials.
const db = await PGlite.create();
const migration = await readFile(
  new URL(
    '../supabase/migrations/20261021024941_app_store_billing_access.sql',
    import.meta.url,
  ),
  'utf8',
);
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const users = {
  beta: id(1),
  grandfatheredFree: id(2),
  free: id(3),
  stripe: id(4),
  appStore: id(5),
  coexist: id(6),
  collaborator: id(7),
  expiredBeta: id(8),
  expiredStripe: id(9),
  expiredAppStore: id(10),
  futureBeta: id(11),
};
const appStoreArgs = [
  users.appStore,
  'active',
  'homedoc.pro.monthly',
  '2099-01-01T00:00:00Z',
  'sandbox',
  '2026-10-20T10:00:00Z',
];

const setUser = async (userId) => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
    userId,
  ]);
  await db.exec('set role authenticated');
};

const resetRole = async () => db.exec('reset role');

const insertProperty = async (userId, propertyId) => {
  await setUser(userId);
  try {
    await db.query(
      'insert into public.properties (id, user_id) values ($1, $2)',
      [propertyId, userId],
    );
  } finally {
    await resetRole();
  }
};

const accessFor = async (userId) =>
  (
    await db.query('select public.billing_access_for_user($1) as access', [
      userId,
    ])
  ).rows[0].access;

const canExecute = async (role, signature) =>
  (
    await db.query('select has_function_privilege($1, $2, $3) as allowed', [
      role,
      signature,
      'EXECUTE',
    ])
  ).rows[0].allowed;

const canAccessTable = async (role, table, privilege) =>
  (
    await db.query('select has_table_privilege($1, $2, $3) as allowed', [
      role,
      table,
      privilege,
    ])
  ).rows[0].allowed;

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to public;
    grant execute on function auth.uid() to public;
    grant usage on schema public to anon, authenticated, service_role;

    create table public.properties (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id),
      name text
    );
    alter table public.properties enable row level security;
    create policy "Users manage owned properties" on public.properties
      for all to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
    grant select, insert, update on public.properties to authenticated;
    grant select, insert, update, delete on public.properties to service_role;

    create table public.property_collaborators (
      property_id uuid not null references public.properties(id),
      user_id uuid not null references auth.users(id),
      primary key (property_id, user_id)
    );

    create table public.user_entitlements (
      user_id uuid primary key references auth.users(id) on delete cascade,
      plan text not null default 'free',
      status text not null default 'free',
      current_period_end timestamptz
    );

    insert into auth.users (id) values
      ('${users.beta}'), ('${users.grandfatheredFree}'), ('${users.free}'),
      ('${users.stripe}'), ('${users.appStore}'), ('${users.coexist}'),
      ('${users.collaborator}'), ('${users.expiredBeta}'),
      ('${users.expiredStripe}'), ('${users.expiredAppStore}'),
      ('${users.futureBeta}');

    -- Existing records remain readable even when a free user's account has
    -- more than one property at the migration boundary.
    insert into public.properties (id, user_id, name) values
      ('${id(101)}', '${users.beta}', 'Beta home'),
      ('${id(102)}', '${users.grandfatheredFree}', 'Existing home one'),
      ('${id(103)}', '${users.grandfatheredFree}', 'Existing home two');
    insert into public.property_collaborators (property_id, user_id)
    values ('${id(102)}', '${users.collaborator}');
  `);

  await db.exec(migration);

  const backfill = await db.query(
    'select count(*)::int as count from public.beta_access',
  );
  assert.equal(backfill.rows[0].count, Object.keys(users).length);
  assert.deepEqual(
    await db
      .query(
        'select user_id, expires_at from public.beta_access where user_id = $1',
        [users.beta],
      )
      .then((r) => r.rows[0]),
    { user_id: users.beta, expires_at: null },
    'existing beta users are backfilled without an invented expiry',
  );

  await db.exec(`
    delete from public.beta_access
    where user_id <> '${users.beta}';
    insert into public.beta_access (user_id, expires_at)
    values ('${users.expiredBeta}', '2000-01-01T00:00:00Z'),
           ('${users.futureBeta}', '2099-01-01T00:00:00Z');
    insert into public.user_entitlements (user_id, plan, status, current_period_end)
    values ('${users.stripe}', 'pro', 'active', null),
           ('${users.coexist}', 'pro', 'trialing', '2099-02-01T00:00:00Z'),
           ('${users.beta}', 'pro', 'active', '2099-04-01T00:00:00Z'),
           ('${users.expiredStripe}', 'pro', 'active', '2000-01-01T00:00:00Z');
  `);

  for (const role of ['anon', 'authenticated']) {
    assert.equal(
      await canExecute(role, 'public.billing_access_for_user(uuid)'),
      false,
      `${role} cannot query billing access for arbitrary users`,
    );
    assert.equal(
      await canExecute(
        role,
        'public.save_app_store_entitlement(uuid,text,text,timestamp with time zone,text,timestamp with time zone)',
      ),
      false,
      `${role} cannot write App Store entitlements`,
    );
  }
  assert.equal(
    await canExecute('service_role', 'public.billing_access_for_user(uuid)'),
    true,
  );
  assert.equal(
    await canExecute(
      'service_role',
      'public.save_app_store_entitlement(uuid,text,text,timestamp with time zone,text,timestamp with time zone)',
    ),
    true,
  );
  assert.equal(await canExecute('anon', 'public.get_billing_access()'), false);
  assert.equal(
    await canExecute('authenticated', 'public.get_billing_access()'),
    true,
  );
  assert.equal(
    await canExecute('service_role', 'public.get_billing_access()'),
    false,
  );
  for (const table of ['public.app_store_entitlements', 'public.beta_access']) {
    assert.equal(await canAccessTable('anon', table, 'SELECT'), false);
    assert.equal(await canAccessTable('authenticated', table, 'SELECT'), true);
    assert.equal(await canAccessTable('authenticated', table, 'INSERT'), false);
    assert.equal(await canAccessTable('service_role', table, 'INSERT'), true);
  }

  await db.exec('set role service_role');
  await db.query(
    'select public.save_app_store_entitlement($1, $2, $3, $4, $5, $6)',
    appStoreArgs,
  );
  await db.query(
    `select public.save_app_store_entitlement(
      $1, 'active', 'homedoc.pro.monthly', '2099-03-01T00:00:00Z',
      'production', '2026-10-20T10:00:00Z'
    )`,
    [users.coexist],
  );
  await db.query(
    `select public.save_app_store_entitlement(
      $1, 'active', 'homedoc.pro.monthly', '2099-05-01T00:00:00Z',
      'production', '2026-10-20T10:00:00Z'
    )`,
    [users.futureBeta],
  );
  await db.query(
    `select public.save_app_store_entitlement(
      $1, 'expired', 'stale.product', '2000-01-01T00:00:00Z', 'production',
      '2026-10-20T09:59:59Z'
    )`,
    [users.appStore],
  );
  const savedEntitlement = await db.query(
    'select status, product_id, expires_at, environment, updated_at from public.app_store_entitlements where user_id = $1',
    [users.appStore],
  );
  assert.equal(savedEntitlement.rows[0].status, 'active');
  assert.equal(savedEntitlement.rows[0].product_id, 'homedoc.pro.monthly');
  assert.equal(savedEntitlement.rows[0].environment, 'sandbox');
  assert.equal(
    new Date(savedEntitlement.rows[0].expires_at).getUTCFullYear(),
    2099,
  );
  assert.equal(
    new Date(savedEntitlement.rows[0].updated_at).toISOString(),
    '2026-10-20T10:00:00.000Z',
    'an earlier canonical fetch cannot replace a newer observation',
  );
  await assert.rejects(
    db.query(
      `select public.save_app_store_entitlement(
        $1, 'pending', 'invalid.product', null, 'production', now()
      )`,
      [users.appStore],
    ),
    { code: '22023' },
  );
  await db.exec('reset role');

  const betaAccess = await accessFor(users.beta);
  assert.equal(betaAccess.plan, 'pro');
  assert.equal(betaAccess.status, 'active');
  assert.equal(betaAccess.provider, 'stripe');
  assert.equal(betaAccess.beta_access, true);
  assert.equal(
    new Date(betaAccess.current_period_end).toISOString(),
    '2099-04-01T00:00:00.000Z',
    'active Stripe entitlement takes precedence over preserved beta access',
  );

  assert.deepEqual(await accessFor(users.stripe), {
    plan: 'pro',
    status: 'active',
    provider: 'stripe',
    current_period_end: null,
    beta_access: false,
  });
  const appleAccess = await accessFor(users.appStore);
  assert.equal(appleAccess.plan, 'pro');
  assert.equal(appleAccess.provider, 'app_store');
  assert.equal(appleAccess.beta_access, false);
  assert.equal(new Date(appleAccess.current_period_end).getUTCFullYear(), 2099);
  const coexistAccess = await accessFor(users.coexist);
  assert.equal(coexistAccess.plan, 'pro');
  assert.equal(coexistAccess.provider, 'app_store');
  assert.equal(
    new Date(coexistAccess.current_period_end).getUTCFullYear(),
    2099,
    'App Store access takes provider precedence when Apple and Stripe are both active',
  );
  const appleBetaAccess = await accessFor(users.futureBeta);
  assert.equal(appleBetaAccess.provider, 'app_store');
  assert.equal(appleBetaAccess.beta_access, true);
  await db.exec('set role service_role');
  await db.query(
    `select public.save_app_store_entitlement(
      $1, 'expired', 'homedoc.pro.monthly', '2000-01-01T00:00:00Z',
      'production', '2026-10-20T10:00:01Z'
    )`,
    [users.futureBeta],
  );
  await db.exec('reset role');
  const appleExpiredBetaAccess = await accessFor(users.futureBeta);
  assert.equal(appleExpiredBetaAccess.plan, 'pro');
  assert.equal(appleExpiredBetaAccess.provider, 'beta');
  assert.equal(appleExpiredBetaAccess.beta_access, true);
  assert.equal(
    new Date(appleExpiredBetaAccess.current_period_end).toISOString(),
    '2099-01-01T00:00:00.000Z',
    'preserved beta entitlement resumes after Apple entitlement expires',
  );
  assert.equal((await accessFor(users.expiredBeta)).plan, 'free');
  assert.equal((await accessFor(users.expiredStripe)).plan, 'free');

  await db.exec('set role service_role');
  await db.query(
    `select public.save_app_store_entitlement(
      $1, 'active', 'expired.product', '2000-01-01T00:00:00Z',
      'production', '2026-10-20T10:00:00Z'
    )`,
    [users.expiredAppStore],
  );
  await db.exec('reset role');
  assert.equal((await accessFor(users.expiredAppStore)).plan, 'free');

  await setUser(users.appStore);
  const ownEntitlement = await db.query(
    'select user_id from public.app_store_entitlements',
  );
  assert.deepEqual(ownEntitlement.rows, [{ user_id: users.appStore }]);
  const ownBeta = await db.query('select user_id from public.beta_access');
  assert.deepEqual(ownBeta.rows, []);
  await assert.rejects(
    db.query('insert into public.beta_access (user_id) values ($1)', [
      users.appStore,
    ]),
    { code: '42501' },
  );
  await assert.rejects(
    db.query('select public.billing_access_for_user($1)', [users.beta]),
    { code: '42501' },
  );
  await resetRole();

  await setUser(users.beta);
  const ownBetaAccess = await db.query(
    'select user_id from public.beta_access',
  );
  assert.deepEqual(ownBetaAccess.rows, [{ user_id: users.beta }]);
  await resetRole();

  // The authenticated RPC has no user-id argument and resolves only auth.uid().
  await setUser(users.appStore);
  const userRpc = await db.query(
    'select public.get_billing_access() as access',
  );
  assert.equal(userRpc.rows[0].access.provider, 'app_store');
  await resetRole();

  await insertProperty(users.free, id(201));
  await assert.rejects(insertProperty(users.free, id(202)), {
    code: 'P0001',
    message: 'The free plan allows one owned property',
  });
  await insertProperty(users.grandfatheredFree, id(203))
    .then(() => {
      assert.fail(
        'grandfathered free user should remain at the one-new-property limit',
      );
    })
    .catch((error) => {
      if (error.code !== 'P0001') throw error;
    });
  await setUser(users.grandfatheredFree);
  const existingProperties = await db.query(
    'select id from public.properties order by id',
  );
  assert.equal(existingProperties.rows.length, 2);
  await resetRole();

  await insertProperty(users.stripe, id(204));
  await insertProperty(users.stripe, id(205));
  await insertProperty(users.appStore, id(206));
  await insertProperty(users.appStore, id(207));
  await insertProperty(users.coexist, id(208));
  await insertProperty(users.coexist, id(209));
  await insertProperty(users.beta, id(210));
  await insertProperty(users.beta, id(211));
  await insertProperty(users.futureBeta, id(212));
  await insertProperty(users.futureBeta, id(213));
  await insertProperty(users.expiredBeta, id(214));
  await assert.rejects(insertProperty(users.expiredBeta, id(215)), {
    code: 'P0001',
  });

  // A shared property owned by somebody else does not count toward this user's
  // owned-property limit.
  await insertProperty(users.collaborator, id(216));
  await assert.rejects(insertProperty(users.collaborator, id(217)), {
    code: 'P0001',
  });

  await setUser(users.grandfatheredFree);
  await db.query('update public.properties set name = $1 where id = $2', [
    'Updated existing home',
    id(102),
  ]);
  await resetRole();
  await db.exec('set role service_role');
  await db.query('update public.properties set user_id = $1 where id = $2', [
    users.free,
    id(102),
  ]);
  await resetRole();

  console.log(
    'Billing access passed: beta backfill and expiry, Apple/Stripe/beta provider priority and fallback, out-of-order canonical writes, RPC/table ACLs and RLS, and free owned-property limits.',
  );
} finally {
  await db.close();
}
