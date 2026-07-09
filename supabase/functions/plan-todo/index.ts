import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  phase: "questions" | "plan";
  answers?: { question: string; answer: string }[];
}

interface GeneratedPlan {
  summary: string;
  difficulty: "easy" | "moderate" | "hard" | "expert";
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError(401, "Missing authorization header");
    }

    const body: PlanRequest = await req.json();
    const { todoId, phase, answers } = body;

    if (!todoId || !phase) {
      return jsonError(400, "todoId and phase are required");
    }

    // Create user-scoped client
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user auth
    const { data: userData, error: userErr } =
      await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonError(401, "Invalid authentication");
    }

    // Fetch todo with area + property context
    const { data: todo, error: todoErr } = await userClient
      .from("todos")
      .select(
        `
        id, title, description, status, priority,
        areas (
          id, name, description,
          properties (id, name, address_line_1, city, state)
        )
      `,
      )
      .eq("id", todoId)
      .single();

    if (todoErr || !todo) {
      return jsonError(404, "Todo not found");
    }

    const area = todo.areas as unknown as Area;
    const property = area?.properties as unknown as Property;
    const openai = new OpenAI({ apiKey: openaiKey });

    const context = `Home: ${property?.name || "Unknown"}
Room/Area: ${area?.name || "Unknown"}
Area description: ${area?.description || "N/A"}
Task: ${todo.title}
Task details: ${todo.description || "No additional details"}
Priority: ${todo.priority}
Location: ${property?.city || ""}, ${property?.state || ""}`;

    if (phase === "questions") {
      // Set status
      const adminClient = createClient(supabaseUrl, supabaseKey);
      await adminClient
        .from("todos")
        .update({ plan_status: "questioning" })
        .eq("id", todoId);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              `You are a helpful home improvement planner. Given a home maintenance/repair/improvement task, ask 3-5 specific clarifying questions that will help you create a detailed, actionable plan. Questions should cover things like budget, DIY vs professional preference, timeline, current condition, tools already owned, and any safety concerns. Return ONLY a JSON array of question strings. Keep questions concise and practical.`,
          },
          {
            role: "user",
            content: context,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content || "{}";
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
          "Are you planning to do this yourself or hire a professional?",
          "What's your ideal timeline?",
        ];
      }

      return jsonResponse({ questions });
    }

    if (phase === "plan") {
      if (!answers || answers.length === 0) {
        return jsonError(400, "Answers are required for plan phase");
      }

      const answersText = answers
        .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
        .join("\n\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              `You are an expert home improvement planner. Given a task and the user's answers to clarifying questions, create a detailed, actionable plan. 

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

Be specific, practical, and realistic. Prices should reflect US averages. If this is a rental or the user shouldn't do it themselves, say so in warnings.`,
          },
          {
            role: "user",
            content: `${context}\n\nUser answers:\n${answersText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content || "{}";
      let plan: GeneratedPlan;

      try {
        plan = JSON.parse(content);
      } catch {
        return jsonError(500, "Failed to generate plan");
      }

      // Save plan to database
      const adminClient = createClient(supabaseUrl, supabaseKey);
      await adminClient
        .from("todos")
        .update({
          plan: plan,
          plan_status: "planned",
        })
        .eq("id", todoId);

      return jsonResponse({ plan });
    }

    return jsonError(400, "Invalid phase. Use 'questions' or 'plan'");
  } catch (err) {
    console.error("Plan-todo error:", err);
    return jsonError(500, err instanceof Error ? err.message : "Unknown error");
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string) {
  return jsonResponse({ error: message }, status);
}
