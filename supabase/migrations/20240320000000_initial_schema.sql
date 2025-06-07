-- Create extensions
create extension if not exists "uuid-ossp";

-- Create tables
create table if not exists public.properties (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    address text not null,
    user_id uuid references auth.users not null,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.areas (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    property_id uuid references public.properties not null,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.notes (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    content text,
    images text[] default '{}',
    area_id uuid references public.areas not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.properties enable row level security;
alter table public.areas enable row level security;
alter table public.notes enable row level security;

-- Properties policies
create policy "Users can view their own properties"
    on public.properties for select
    using (auth.uid() = user_id);

create policy "Users can insert their own properties"
    on public.properties for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own properties"
    on public.properties for update
    using (auth.uid() = user_id);

create policy "Users can delete their own properties"
    on public.properties for delete
    using (auth.uid() = user_id);

-- Areas policies
create policy "Users can view areas of their properties"
    on public.areas for select
    using (
        exists (
            select 1 from public.properties
            where properties.id = areas.property_id
            and properties.user_id = auth.uid()
        )
    );

create policy "Users can insert areas to their properties"
    on public.areas for insert
    with check (
        exists (
            select 1 from public.properties
            where properties.id = areas.property_id
            and properties.user_id = auth.uid()
        )
    );

create policy "Users can update areas of their properties"
    on public.areas for update
    using (
        exists (
            select 1 from public.properties
            where properties.id = areas.property_id
            and properties.user_id = auth.uid()
        )
    );

create policy "Users can delete areas of their properties"
    on public.areas for delete
    using (
        exists (
            select 1 from public.properties
            where properties.id = areas.property_id
            and properties.user_id = auth.uid()
        )
    );

-- Notes policies
create policy "Users can view notes of their areas"
    on public.notes for select
    using (
        exists (
            select 1 from public.areas
            join public.properties on properties.id = areas.property_id
            where areas.id = notes.area_id
            and properties.user_id = auth.uid()
        )
    );

create policy "Users can insert notes to their areas"
    on public.notes for insert
    with check (
        exists (
            select 1 from public.areas
            join public.properties on properties.id = areas.property_id
            where areas.id = notes.area_id
            and properties.user_id = auth.uid()
        )
    );

create policy "Users can update notes of their areas"
    on public.notes for update
    using (
        exists (
            select 1 from public.areas
            join public.properties on properties.id = areas.property_id
            where areas.id = notes.area_id
            and properties.user_id = auth.uid()
        )
    );

create policy "Users can delete notes of their areas"
    on public.notes for delete
    using (
        exists (
            select 1 from public.areas
            join public.properties on properties.id = areas.property_id
            where areas.id = notes.area_id
            and properties.user_id = auth.uid()
        )
    ); 