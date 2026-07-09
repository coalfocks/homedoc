-- Store follow-up chat attached to an AI-generated todo plan.
alter table public.todos
    add column if not exists plan_chat jsonb default '[]'::jsonb;

