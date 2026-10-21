import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const uuid = (value) =>
  typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value);
async function load(
  name,
  { signedIn = true, deleted = false, syncFails = false } = {},
) {
  let handler;
  const synced = [];
  const admin = {
    auth: {
      admin: {
        getUserById: async (id) =>
          deleted
            ? { data: {}, error: { status: 404 } }
            : { data: { user: { id } }, error: null },
      },
    },
  };
  const dependencies = {
    'https://deno.land/std@0.224.0/http/server.ts': {
      serve: (fn) => (handler = fn),
    },
    'https://esm.sh/@supabase/supabase-js@2': {
      createClient: (_url, _key, options) =>
        options?.global
          ? {
              auth: {
                getUser: async () =>
                  signedIn
                    ? { data: { user: { id: userA } }, error: null }
                    : { data: {}, error: {} },
              },
            }
          : admin,
    },
    '../_shared/cors.ts': {
      corsHeaders: {},
      jsonResponse: (body, status = 200) =>
        new Response(JSON.stringify(body), { status }),
      jsonError: (status, error) =>
        new Response(JSON.stringify({ error }), { status }),
    },
    '../_shared/app-store.ts': {
      isUserId: uuid,
      saveAppStoreAccess: async (_admin, id) => {
        if (syncFails) throw new Error('offline');
        synced.push(id);
      },
    },
  };
  const source = await readFile(
    new URL(`../supabase/functions/${name}/index.ts`, import.meta.url),
    'utf8',
  );
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports: {},
      Request,
      Response,
      Set,
      Error,
      Deno: {
        env: {
          get: (key) =>
            key === 'REVENUECAT_WEBHOOK_AUTHORIZATION'
              ? 'configured-secret'
              : 'offline-value',
        },
      },
      require: (path) => {
        assert.ok(path in dependencies, path);
        return dependencies[path];
      },
    },
  );
  return { handler, synced };
}
const request = (authorization, body = {}, method = 'POST') =>
  new Request('https://offline.invalid', {
    method,
    headers: authorization
      ? { Authorization: authorization, 'Content-Type': 'application/json' }
      : {},
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  });
let runtime = await load('sync-app-store-entitlement');
assert.equal((await runtime.handler(request(null))).status, 401);
assert.equal(
  (await runtime.handler(request('Bearer fake', {}, 'GET'))).status,
  405,
);
assert.equal(
  (
    await runtime.handler(
      request('Bearer valid', { userId: userB, isPro: true }),
    )
  ).status,
  200,
);
assert.deepEqual(
  runtime.synced,
  [userA],
  'Client identity/paid flags cannot select a billing account',
);
runtime = await load('sync-app-store-entitlement', { signedIn: false });
assert.equal((await runtime.handler(request('Bearer invalid'))).status, 401);
assert.deepEqual(runtime.synced, []);
runtime = await load('sync-app-store-entitlement', { syncFails: true });
assert.equal((await runtime.handler(request('Bearer valid'))).status, 503);

runtime = await load('app-store-webhook');
assert.equal(
  (
    await runtime.handler(
      request('wrong', {
        event: { app_user_id: userA, type: 'INITIAL_PURCHASE' },
      }),
    )
  ).status,
  401,
);
assert.deepEqual(runtime.synced, []);
assert.equal(
  (
    await runtime.handler(
      request('configured-secret', { event: { type: 'TEST' } }),
    )
  ).status,
  200,
);
assert.deepEqual(runtime.synced, []);
assert.equal(
  (
    await runtime.handler(
      request('configured-secret', {
        event: {
          type: 'TRANSFER',
          app_user_id: 'anonymous',
          transferred_from: [userA],
          transferred_to: [userB],
        },
      }),
    )
  ).status,
  200,
);
assert.deepEqual(runtime.synced, [userA, userB]);
runtime = await load('app-store-webhook', { deleted: true });
assert.equal(
  (
    await runtime.handler(
      request('configured-secret', { event: { app_user_id: userA } }),
    )
  ).status,
  200,
);
assert.deepEqual(runtime.synced, [], 'Deleted accounts are never recreated');
runtime = await load('app-store-webhook', { syncFails: true });
assert.equal(
  (
    await runtime.handler(
      request('configured-secret', { event: { app_user_id: userA } }),
    )
  ).status,
  503,
);
console.log(
  'App Store handlers passed: authenticated account binding, forged events denied, transfers, deleted accounts, and retry failures.',
);
