alter table public.notes
    add column if not exists reminder_at timestamptz;

alter table public.todos
    add column if not exists reminder_at timestamptz;

create index if not exists notes_reminder_at_idx
    on public.notes (reminder_at)
    where reminder_at is not null;

create index if not exists todos_reminder_at_idx
    on public.todos (reminder_at)
    where reminder_at is not null;
