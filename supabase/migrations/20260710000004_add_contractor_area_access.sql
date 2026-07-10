create table if not exists public.contractor_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    company_name text,
    trade text,
    verification_status text not null default 'unverified',
    verified_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.contractor_area_access (
    id uuid default gen_random_uuid() primary key,
    area_id uuid references public.areas(id) on delete cascade not null,
    owner_user_id uuid references auth.users(id) on delete cascade not null,
    contractor_user_id uuid references auth.users(id) on delete cascade not null,
    contractor_email text not null,
    contractor_name text,
    company_name text,
    trade text,
    verification_status text not null default 'unverified',
    status text not null default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    revoked_at timestamp with time zone,
    unique (area_id, contractor_user_id)
);

alter table public.notes
    add column if not exists note_source text not null default 'owner',
    add column if not exists contractor_user_id uuid references auth.users(id),
    add column if not exists contractor_area_access_id uuid references public.contractor_area_access(id),
    add column if not exists contractor_name text,
    add column if not exists contractor_company text;

create index if not exists contractor_area_access_area_id_idx
    on public.contractor_area_access(area_id);

create index if not exists contractor_area_access_contractor_user_id_idx
    on public.contractor_area_access(contractor_user_id);

create index if not exists notes_contractor_user_id_idx
    on public.notes(contractor_user_id);

alter table public.contractor_profiles enable row level security;
alter table public.contractor_area_access enable row level security;

drop policy if exists "Users can view their own contractor profile"
    on public.contractor_profiles;
drop policy if exists "Users can upsert their own contractor profile"
    on public.contractor_profiles;
drop policy if exists "Users can update their own contractor profile"
    on public.contractor_profiles;

create policy "Users can view their own contractor profile"
    on public.contractor_profiles for select
    using (auth.uid() = user_id);

create policy "Users can upsert their own contractor profile"
    on public.contractor_profiles for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own contractor profile"
    on public.contractor_profiles for update
    using (auth.uid() = user_id);

drop policy if exists "Owners can view contractor access for their areas"
    on public.contractor_area_access;
drop policy if exists "Contractors can view assigned area access"
    on public.contractor_area_access;

create policy "Owners can view contractor access for their areas"
    on public.contractor_area_access for select
    using (auth.uid() = owner_user_id);

create policy "Contractors can view assigned area access"
    on public.contractor_area_access for select
    using (auth.uid() = contractor_user_id and status = 'active');

drop policy if exists "Contractors can view assigned properties"
    on public.properties;
drop policy if exists "Contractors can view assigned areas"
    on public.areas;
drop policy if exists "Contractors can view notes in assigned areas"
    on public.notes;
drop policy if exists "Contractors can add work notes to assigned areas"
    on public.notes;
drop policy if exists "Contractors can update their own work notes"
    on public.notes;

create policy "Contractors can view assigned properties"
    on public.properties for select
    using (
        exists (
            select 1
            from public.contractor_area_access caa
            join public.areas on areas.id = caa.area_id
            where areas.property_id = properties.id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        )
    );

create policy "Contractors can view assigned areas"
    on public.areas for select
    using (
        exists (
            select 1 from public.contractor_area_access caa
            where caa.area_id = areas.id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        )
    );

create policy "Contractors can view notes in assigned areas"
    on public.notes for select
    using (
        exists (
            select 1 from public.contractor_area_access caa
            where caa.area_id = notes.area_id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        )
    );

create policy "Contractors can add work notes to assigned areas"
    on public.notes for insert
    with check (
        note_source = 'contractor'
        and contractor_user_id = auth.uid()
        and exists (
            select 1 from public.contractor_area_access caa
            where caa.id = contractor_area_access_id
            and caa.area_id = notes.area_id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        )
    );

create policy "Contractors can update their own work notes"
    on public.notes for update
    using (
        note_source = 'contractor'
        and contractor_user_id = auth.uid()
        and exists (
            select 1 from public.contractor_area_access caa
            where caa.id = notes.contractor_area_access_id
            and caa.area_id = notes.area_id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        )
    )
    with check (
        note_source = 'contractor'
        and contractor_user_id = auth.uid()
        and exists (
            select 1 from public.contractor_area_access caa
            where caa.id = notes.contractor_area_access_id
            and caa.area_id = notes.area_id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        )
    );

drop trigger if exists touch_contractor_profiles_updated_at
    on public.contractor_profiles;

create trigger touch_contractor_profiles_updated_at
    before update on public.contractor_profiles
    for each row
    execute function public.touch_user_entitlements_updated_at();

drop trigger if exists touch_contractor_area_access_updated_at
    on public.contractor_area_access;

create trigger touch_contractor_area_access_updated_at
    before update on public.contractor_area_access
    for each row
    execute function public.touch_user_entitlements_updated_at();
