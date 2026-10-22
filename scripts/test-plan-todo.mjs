import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const handlerSource = await readFile(
  new URL('../supabase/functions/plan-todo/index.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(handlerSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

const questionResult = {
  questions: ['What is the budget?', 'DIY or hire?', 'When?'],
};
const planResult = {
  summary: 'Replace the light safely.',
  difficulty: 'moderate',
  estimatedTime: '2 hours',
  estimatedCostRange: { min: 25, max: 80, currency: 'USD' },
  steps: [{ title: 'Turn off power', description: 'Switch off the breaker.' }],
  materials: [],
  tools: ['Voltage tester'],
  warnings: ['Verify power is off.'],
  checkpoints: ['Test the fixture.'],
};

function loadHandler({
  auth = 'valid',
  todoExists = true,
  quotaAllowed = true,
  existingPlan = null,
  existingChat = [],
  completionContent,
  billingAccess = {
    plan: 'pro',
    status: 'active',
    provider: 'beta',
    beta_access: true,
  },
} = {}) {
  let handler;
  const completions = [];
  const updates = [];
  const quotaCalls = [];
  const todo = {
    id: 'todo-1',
    title: 'Replace the hallway light',
    description: 'Keep the existing dimmer.',
    status: 'todo',
    priority: 'high',
    plan: existingPlan,
    plan_chat: existingChat,
    areas: {
      id: 'area-1',
      name: 'Hallway',
      description: 'Narrow interior hall',
      properties: {
        id: 'property-1',
        name: 'Maple House',
        address_line_1: '123 Test Street',
        city: 'Denver',
        state: 'CO',
      },
    },
  };

  const OpenAIStub = class {
    constructor() {
      this.chat = {
        completions: {
          create: async (params) => {
            completions.push(params);
            return {
              choices: [{ message: { content: completionContent } }],
            };
          },
        },
      };
    }
  };

  const makeQuery = (kind, table, scope) => {
    const query = {
      operation: kind,
      filters: [],
      values: undefined,
      select() {
        return this;
      },
      update(values) {
        this.operation = 'update';
        this.values = values;
        return this;
      },
      eq(column, value) {
        this.filters.push([column, value]);
        return this;
      },
      async single() {
        if (table === 'todos' && kind === 'select') {
          assert.equal(
            scope,
            'user',
            'todo access must be checked with the user-scoped client',
          );
          const requestedTodo = this.filters.some(
            ([column, value]) => column === 'id' && value === todo.id,
          );
          return todoExists && requestedTodo
            ? { data: todo, error: null }
            : { data: null, error: { message: 'not found' } };
        }
        if (kind === 'rpc') {
          return {
            data: quotaAllowed
              ? { allowed: true, used: 1, monthly_limit: 20 }
              : { allowed: false, used: 20, monthly_limit: 20 },
            error: null,
          };
        }
        throw new Error(`Unexpected single() query: ${table}/${kind}`);
      },
      async maybeSingle() {
        assert.equal(table, 'user_entitlements');
        return { data: { plan: 'free', status: 'active' }, error: null };
      },
      then(resolve, reject) {
        if (this.operation === 'update' && table === 'todos') {
          assert.ok(
            this.filters.some(
              ([column, value]) => column === 'id' && value === todo.id,
            ),
            'updates must target the authorized todo',
          );
          updates.push(this.values);
          Object.assign(todo, this.values);
        }
        return Promise.resolve({ data: null, error: null }).then(
          resolve,
          reject,
        );
      },
    };
    return query;
  };

  const createClient = (_url, _key, options) => {
    if (options?.global?.headers?.Authorization) {
      return {
        auth: {
          getUser: async () =>
            auth === 'valid'
              ? { data: { user: { id: 'user-1' } }, error: null }
              : { data: { user: null }, error: { message: 'invalid token' } },
        },
        from: (table) => makeQuery('select', table, 'user'),
      };
    }
    return {
      from: (table) => makeQuery('select', table, 'admin'),
      rpc: (name, args) => {
        if (name === 'billing_access_for_user') {
          assert.equal(args.p_user_id, 'user-1');
          return Promise.resolve({ data: billingAccess, error: null });
        }
        assert.equal(name, 'consume_ai_plan_call');
        quotaCalls.push({ name, args });
        assert.equal(
          args.p_user_id,
          'user-1',
          'quota must be charged to the authenticated user',
        );
        return makeQuery('rpc', name, 'admin');
      },
    };
  };

  const dependencies = {
    'https://deno.land/std@0.224.0/http/server.ts': {
      serve: (callback) => {
        handler = callback;
      },
    },
    'https://esm.sh/@supabase/supabase-js@2': { createClient },
    'https://esm.sh/openai@7.32.0': OpenAIStub,
    'https://esm.sh/openai@4.55.0': OpenAIStub,
  };
  const sandbox = {
    exports: {},
    module: { exports: {} },
    require: (specifier) => {
      if (!(specifier in dependencies)) {
        throw new Error(
          `Unexpected external dependency in offline test: ${specifier}`,
        );
      }
      return dependencies[specifier];
    },
    Deno: {
      env: {
        get: (name) =>
          ({
            SUPABASE_URL: 'https://example.invalid',
            SUPABASE_SERVICE_ROLE_KEY: 'offline-service-key',
            SUPABASE_ANON_KEY: 'offline-anon-key',
            OPENAI_API_KEY: 'offline-openai-key',
          })[name],
      },
    },
    Request,
    Response,
    console,
  };
  vm.runInNewContext(compiled, sandbox, { filename: 'plan-todo-handler.cjs' });
  assert.equal(
    typeof handler,
    'function',
    'Edge handler should register through serve()',
  );

  return { handler, completions, updates, quotaCalls };
}

async function invoke(runtime, body, authorization = 'Bearer test-user-token') {
  const headers = { 'Content-Type': 'application/json' };
  if (authorization) headers.Authorization = authorization;
  return runtime.handler(
    new Request('https://edge.example.invalid/plan-todo', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
  );
}

function assertCompletion(params, { maxTokens, contextParts, hasJsonFormat }) {
  assert.equal(params.model, 'gpt-5.6-luna');
  assert.equal(params.reasoning_effort, 'none');
  assert.equal(params.max_completion_tokens, maxTokens);
  assert.equal('max_tokens' in params, false);
  assert.equal('temperature' in params, false);
  if (hasJsonFormat)
    assert.equal(
      JSON.stringify(params.response_format),
      JSON.stringify({ type: 'json_object' }),
    );
  const prompt = params.messages.map((message) => message.content).join('\n');
  for (const part of contextParts)
    assert.ok(prompt.includes(part), `prompt should include ${part}`);
}

{
  const runtime = loadHandler({
    completionContent: JSON.stringify(questionResult),
  });
  const response = await invoke(runtime, {
    todoId: 'todo-1',
    phase: 'questions',
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), questionResult);
  assert.equal(runtime.completions.length, 1);
  assertCompletion(runtime.completions[0], {
    maxTokens: 500,
    contextParts: [
      'Maple House',
      'Hallway',
      'Denver, CO',
      'Replace the hallway light',
    ],
    hasJsonFormat: true,
  });
  assert.ok(
    runtime.updates.some((update) => update.plan_status === 'questioning'),
  );
  assert.equal(runtime.quotaCalls.length, 1);
}

{
  const runtime = loadHandler({
    completionContent: JSON.stringify(planResult),
  });
  const answers = [{ question: 'Who will do the work?', answer: 'I will.' }];
  const response = await invoke(runtime, {
    todoId: 'todo-1',
    phase: 'plan',
    answers,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { plan: planResult });
  assertCompletion(runtime.completions[0], {
    maxTokens: 2000,
    contextParts: [
      'Maple House',
      'Hallway',
      'Replace the hallway light',
      'I will.',
    ],
    hasJsonFormat: true,
  });
  assert.ok(
    runtime.updates.some(
      (update) =>
        update.plan_status === 'planned' &&
        update.plan.summary === planResult.summary &&
        Array.isArray(update.plan_chat),
    ),
    'generated plan should be persisted with a reset chat history',
  );
}

{
  const runtime = loadHandler({
    existingPlan: planResult,
    existingChat: [
      {
        role: 'user',
        content: 'Earlier question',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    completionContent: 'Use a voltage tester before touching wires.',
  });
  const response = await invoke(runtime, {
    todoId: 'todo-1',
    phase: 'chat',
    message: 'What should I check first?',
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(
    body.message.content,
    'Use a voltage tester before touching wires.',
  );
  assert.equal(body.chat.length, 3);
  assert.equal(body.chat[1].content, 'What should I check first?');
  assertCompletion(runtime.completions[0], {
    maxTokens: 700,
    contextParts: [
      'Maple House',
      'Replace the hallway light',
      'Earlier question',
      'What should I check first?',
    ],
    hasJsonFormat: false,
  });
  assert.ok(runtime.updates.some((update) => update.plan_chat?.length === 3));
}

for (const [name, options, authorization, expectedStatus] of [
  ['missing authorization', {}, null, 401],
  ['invalid authorization', { auth: 'invalid' }, 'Bearer invalid', 401],
  [
    'todo inaccessible under user-scoped read',
    { todoExists: false },
    'Bearer test-user-token',
    404,
  ],
  [
    'monthly AI quota denied',
    { quotaAllowed: false },
    'Bearer test-user-token',
    429,
  ],
]) {
  const runtime = loadHandler({
    ...options,
    completionContent: JSON.stringify(questionResult),
  });
  const response = await invoke(
    runtime,
    { todoId: 'todo-1', phase: 'questions' },
    authorization,
  );
  assert.equal(
    response.status,
    expectedStatus,
    `${name} should return ${expectedStatus}`,
  );
  assert.equal(runtime.completions.length, 0, `${name} must not call OpenAI`);
  if (name === 'monthly AI quota denied') {
    assert.equal(runtime.quotaCalls.length, 1);
    assert.equal(
      runtime.updates.length,
      0,
      'denied quota must not change todo state',
    );
  }
}

console.log(
  'Plan-todo handler passed offline checks for all phases, provider parameters, persistence, auth, user-scoped access, and quota denial.',
);

for (const [billingAccess, limit] of [
  [{ plan: 'free', status: 'free', provider: 'free', beta_access: false }, 4],
  [{ plan: 'pro', status: 'active', provider: 'beta', beta_access: true }, 20],
  [
    { plan: 'pro', status: 'active', provider: 'app_store', beta_access: true },
    50,
  ],
  [
    { plan: 'pro', status: 'active', provider: 'stripe', beta_access: false },
    50,
  ],
]) {
  const runtime = loadHandler({
    billingAccess,
    completionContent: JSON.stringify(questionResult),
  });
  const response = await runtime.handler(
    new Request('https://example.invalid/plan-todo', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ todoId: 'todo-1', phase: 'questions' }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(runtime.quotaCalls[0].args.p_monthly_limit, limit);
}
console.log(
  'AI allowance selection passed: free 4, beta 20, paid Apple/Stripe 50.',
);
