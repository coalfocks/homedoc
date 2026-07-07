-- Add todos table (scoped to areas, same ownership chain as notes)

create table if not exists public.todos (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    status text not null default 'pending',   -- pending | in_progress | done
    priority text not null default 'medium',  -- low | medium | high
    area_id uuid references public.areas not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.todos enable row level security;

-- Todos policies (same pattern as notes — ownership through area → property)
create policy "Users can view todos of their areas"
    on public.todos for select
    using (
        exists (
            select 1 from public.areas
            join public.properties on properties.id = areas.property_id
            where areas.id = todos.area_id
            and properties.user_id = auth.uid()
        )
    );

create policy "Users can insert todos to their areas"
    on public.todos for insert
    with check (
        exists (
            select 1 from public.areas
            join public.properties on properties.id = areas.property_id
            where areas.id = todos.area_id
            and properties.user_id = auth.uid()
        )
    );

create policy "Users can update todos of their areas"
    on public.todos for update
    using (
        exists (
            select 1 from public.areas
            join public.properties on properties.id = areas.property_id
            where areas.id = todos.area_id
            and properties.user_id = auth.uid()
        )
    );

create policy "Users can delete todos of their areas"
    on public.todos for delete
    using (
        exists (
            select 1 from public.areas
            join public.properties on properties.id = areas.property_id
            where areas.id = todos.area_id
            and properties.user_id = auth.uid()
        )
    );

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger todos_updated_at
    before update on public.todos
    for each row
    execute function public.handle_updated_at();
