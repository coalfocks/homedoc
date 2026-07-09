-- Add plan column to todos for storing AI-generated plans
alter table public.todos
    add column if not exists plan jsonb,
    add column if not exists plan_status text default null;  -- null | questioning | planned | error

-- Enable text search on title/description for future features
create index if not exists todos_plan_status_idx
    on public.todos(plan_status)
    where plan_status is not null;
