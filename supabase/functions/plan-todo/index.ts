import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
}

interface Area {
  id: string;
  name: string;
  description: string | null;
  properties?: Property | null;
}

interface Property {
  id: string;
  name: string;
  address_line_1: string;
  city: string;
  state: string;
}

interface PlanRequest {
  todoId: string;
  phase: 'questions' | 'plan' | 'chat';
  answers?: { question: string; answer: string }[];
  message?: string;
}

interface GeneratedPlan {
  summary: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert';
  estimatedTime: string;
  estimatedCostRange: { min: number; max: number; currency: string };
  steps: {
    title: string;
    description: string;
    tips?: string;
    estimatedMinutes?: number;
  }[];
  materials: {
    name: string;
    estimatedPrice: number;
    notes?: string;
    purchaseUrl?: string;
  }[];
  tools: string[];
  warnings: string[];
  professionalHelp?: {
    type: string;
    when: string;
    averageCost?: string;
  }[];
  checkpoints: string[];
}

interface PlanChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const freeMonthlyAiCallLimit = 20;
const proMonthlyAiCallLimit = 300;
const maxAnswersPayloadLength = 6000;
const maxChatMessageLength = 2000;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError(401, 'Missing authorization header');
    }

    const body: PlanRequest = await req.json();
    const { todoId, phase, answers } = body;

    if (!todoId || !phase) {
      return jsonError(400, 'todoId and phase are required');
    }

    // Create a user-scoped client so RLS verifies this user owns the todo.
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user auth
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonError(401, 'Invalid authentication');
    }

    // Fetch todo with area + property context
    const { data: todo, error: todoErr } = await userClient
      .from('todos')
      .select(
        `
        id, title, description, status, priority, plan, plan_chat,
        areas (
          id, name, description,
          properties (id, name, address_line_1, city, state)
        )
      `,
      )
      .eq('id', todoId)
      .single();

    if (todoErr || !todo) {
      return jsonError(404, 'Todo not found');
    }

    const area = todo.areas as unknown as Area;
    const property = area?.properties as unknown as Property;
    const adminClient = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });
    const requireAiQuota = async () => {
      const quota = await consumeAiPlanCall(adminClient, userData.user.id);

      if (!quota.allowed) {
        return jsonError(
          429,
          `AI planning limit reached for this month (${quota.used}/${quota.limit}).`,
        );
      }

      return null;
    };

    const context = `Home: ${property?.name || 'Unknown'}
Room/Area: ${area?.name || 'Unknown'}
Area description: ${area?.description || 'N/A'}
Task: ${todo.title}
Task details: ${todo.description || 'No additional details'}
Priority: ${todo.priority}
Location: ${property?.city || ''}, ${property?.state || ''}`;

    if (phase === 'questions') {
      const quotaError = await requireAiQuota();
      if (quotaError) return quotaError;

      // Set status after the RLS-protected read has verified ownership.
      await adminClient
        .from('todos')
        .update({ plan_status: 'questioning' })
        .eq('id', todoId);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful home improvement planner. Given a home maintenance/repair/improvement task, ask 3-5 specific clarifying questions that will help you create a detailed, actionable plan. Questions should cover things like budget, DIY vs professional preference, timeline, current condition, tools already owned, and any safety concerns. Return ONLY a JSON array of question strings. Keep questions concise and practical.`,
          },
          {
            role: 'user',
            content: context,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      let questions: string[];

      try {
        const parsed = JSON.parse(content);
        questions = parsed.questions || parsed;
        if (!Array.isArray(questions)) {
          questions = Object.values(parsed);
        }
      } catch {
        questions = [
          "What's your budget for this project?",
          'Are you planning to do this yourself or hire a professional?',
          "What's your ideal timeline?",
        ];
      }

      return jsonResponse({ questions });
    }

    if (phase === 'plan') {
      if (!answers || answers.length === 0) {
        return jsonError(400, 'Answers are required for plan phase');
      }

      const answersText = answers
        .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
        .join('\n\n');

      if (answersText.length > maxAnswersPayloadLength) {
        return jsonError(413, 'Answers are too long for one plan request');
      }

      const quotaError = await requireAiQuota();
      if (quotaError) return quotaError;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert home improvement planner. Given a task and the user's answers to clarifying questions, create a detailed, actionable plan.

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview",
  "difficulty": "easy|moderate|hard|expert",
  "estimatedTime": "e.g. '2-3 hours' or '1 weekend'",
  "estimatedCostRange": { "min": 50, "max": 150, "currency": "USD" },
  "steps": [{ "title": "Step name", "description": "What to do", "tips": "Pro tip", "estimatedMinutes": 30 }],
  "materials": [{ "name": "Item", "estimatedPrice": 25, "notes": "Size/spec", "purchaseUrl": "optional" }],
  "tools": ["list", "of", "tools"],
  "warnings": ["Safety note 1", "Important caveat"],
  "professionalHelp": [{ "type": "Plumber", "when": "If you hit a pipe you can't identify", "averageCost": "$150-300" }],
  "checkpoints": ["Milestone 1", "Milestone 2"]
}

Be specific, practical, and realistic. Prices should reflect US averages. When a common product can be recommended, include a direct purchaseUrl from a mainstream US retailer or manufacturer. Only include links that are likely to be stable and relevant; otherwise omit purchaseUrl. If this is a rental or the user shouldn't do it themselves, say so in warnings.`,
          },
          {
            role: 'user',
            content: `${context}\n\nUser answers:\n${answersText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      let plan: GeneratedPlan;

      try {
        plan = JSON.parse(content);
      } catch {
        return jsonError(500, 'Failed to generate plan');
      }

      // Save plan to database
      await adminClient
        .from('todos')
        .update({
          plan: plan,
          plan_status: 'planned',
          plan_chat: [],
        })
        .eq('id', todoId);

      return jsonResponse({ plan });
    }

    if (phase === 'chat') {
      const message = body.message?.trim();
      const existingPlan = (todo as { plan?: GeneratedPlan | null }).plan;

      if (!existingPlan) {
        return jsonError(400, 'A generated plan is required before chatting');
      }

      if (!message) {
        return jsonError(400, 'Message is required for chat phase');
      }

      if (message.length > maxChatMessageLength) {
        return jsonError(413, 'Message is too long for one chat request');
      }

      const quotaError = await requireAiQuota();
      if (quotaError) return quotaError;

      const existingChat = Array.isArray(
        (todo as { plan_chat?: unknown }).plan_chat,
      )
        ? (todo as { plan_chat: PlanChatMessage[] }).plan_chat
        : [];
      const trimmedChat = existingChat.slice(-12);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a plan assistant inside a home maintenance app. Answer follow-up questions about the saved plan and the specific todo context. Be concise, practical, and safety-aware.

If the user asks to change the plan, explain the recommended change clearly, but do not claim you changed saved steps or todos. Keep answers grounded in the provided plan. Ask one focused follow-up question only when needed.`,
          },
          {
            role: 'user',
            content: `${context}

Saved plan JSON:
${JSON.stringify(existingPlan)}

Recent chat:
${trimmedChat.map((m) => `${m.role}: ${m.content}`).join('\n') || 'None'}

New question:
${message}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 700,
      });

      const assistantText =
        completion.choices[0]?.message?.content?.trim() ||
        "I couldn't generate an answer for that.";
      const now = new Date().toISOString();
      const nextChat: PlanChatMessage[] = [
        ...existingChat,
        { role: 'user', content: message, createdAt: now },
        { role: 'assistant', content: assistantText, createdAt: now },
      ];

      await adminClient
        .from('todos')
        .update({ plan_chat: nextChat })
        .eq('id', todoId);

      return jsonResponse({
        message: { role: 'assistant', content: assistantText, createdAt: now },
        chat: nextChat,
      });
    }

    return jsonError(400, "Invalid phase. Use 'questions', 'plan', or 'chat'");
  } catch (err) {
    console.error('Plan-todo error:', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(status: number, message: string) {
  return jsonResponse({ error: message }, status);
}

async function consumeAiPlanCall(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data: entitlement, error: entitlementError } = await adminClient
    .from('user_entitlements')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (entitlementError) throw entitlementError;

  const isPro =
    entitlement?.plan === 'pro' &&
    ['active', 'trialing'].includes(entitlement.status);
  const limit = isPro ? proMonthlyAiCallLimit : freeMonthlyAiCallLimit;
  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
    .toISOString()
    .slice(0, 10);

  const { data: usage, error: usageError } = await adminClient
    .rpc('consume_ai_plan_call', {
      p_user_id: userId,
      p_period_start: periodStart,
      p_monthly_limit: limit,
    })
    .single();

  if (usageError) throw usageError;

  return {
    allowed: Boolean(usage?.allowed),
    used: usage?.used ?? limit,
    limit: usage?.monthly_limit ?? limit,
  };
}
