-- Add household sharing so multiple HomeDoc users can collaborate on the same
-- properties while contractor access remains scoped to assigned areas.

create table if not exists public.households (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.household_members (
    household_id uuid references public.households(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text not null default 'member',
    invited_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (household_id, user_id),
    constraint household_members_role_check check (role in ('owner', 'admin', 'member'))
);

alter table public.properties
    add column if not exists household_id uuid references public.households(id) on delete set null;

create index if not exists properties_household_id_idx
    on public.properties(household_id);

create index if not exists household_members_user_id_idx
    on public.household_members(user_id);

alter table public.households enable row level security;
alter table public.household_members enable row level security;

insert into public.households (id, name, created_by)
select gen_random_uuid(), 'My household', p.user_id
from public.properties p
where p.household_id is null
and p.user_id is not null
group by p.user_id;

update public.properties p
set household_id = h.id
from public.households h
where p.household_id is null
and h.created_by = p.user_id;

insert into public.household_members (household_id, user_id, role, invited_by)
select distinct p.household_id, p.user_id, 'owner', p.user_id
from public.properties p
where p.household_id is not null
and p.user_id is not null
on conflict (household_id, user_id) do update
set role = 'owner',
    updated_at = timezone('utc'::text, now());

create or replace function public.assign_property_household()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    target_household_id uuid;
begin
    if new.household_id is not null then
        return new;
    end if;

    select hm.household_id
    into target_household_id
    from public.household_members hm
    where hm.user_id = new.user_id
    and hm.role in ('owner', 'admin')
    order by hm.created_at
    limit 1;

    if target_household_id is null then
        insert into public.households (name, created_by)
        values ('My household', new.user_id)
        returning id into target_household_id;

        insert into public.household_members (
            household_id,
            user_id,
            role,
            invited_by
        )
        values (
            target_household_id,
            new.user_id,
            'owner',
            new.user_id
        )
        on conflict (household_id, user_id) do nothing;
    end if;

    new.household_id = target_household_id;
    return new;
end;
$$;

drop trigger if exists assign_property_household_before_insert on public.properties;

create trigger assign_property_household_before_insert
    before insert on public.properties
    for each row
    execute function public.assign_property_household();

create or replace function public.current_user_is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.household_members hm
        where hm.household_id = p_household_id
        and hm.user_id = auth.uid()
    );
$$;

create or replace function public.current_user_can_manage_household(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.household_members hm
        where hm.household_id = p_household_id
        and hm.user_id = auth.uid()
        and hm.role in ('owner', 'admin')
    );
$$;

create or replace function public.current_user_owns_property(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.properties p
        where p.id = p_property_id
        and (
            p.user_id = auth.uid()
            or public.current_user_can_manage_household(p.household_id)
        )
    );
$$;

create or replace function public.current_user_owns_area(p_area_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.areas a
        join public.properties p on p.id = a.property_id
        where a.id = p_area_id
        and (
            p.user_id = auth.uid()
            or public.current_user_can_manage_household(p.household_id)
        )
    );
$$;

create or replace function public.current_user_has_property_access(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.properties p
        where p.id = p_property_id
        and (
            p.user_id = auth.uid()
            or public.current_user_is_household_member(p.household_id)
        )
    )
    or exists (
        select 1
        from public.contractor_area_access caa
        join public.areas a on a.id = caa.area_id
        where a.property_id = p_property_id
        and caa.contractor_user_id = auth.uid()
        and caa.status = 'active'
    );
$$;

create or replace function public.current_user_has_area_access(p_area_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.areas a
        join public.properties p on p.id = a.property_id
        where a.id = p_area_id
        and (
            p.user_id = auth.uid()
            or public.current_user_is_household_member(p.household_id)
        )
    )
    or exists (
        select 1
        from public.contractor_area_access caa
        where caa.area_id = p_area_id
        and caa.contractor_user_id = auth.uid()
        and caa.status = 'active'
    );
$$;

grant execute on function public.current_user_is_household_member(uuid) to authenticated;
grant execute on function public.current_user_can_manage_household(uuid) to authenticated;

drop policy if exists "Users can view their own household memberships" on public.household_members;
drop policy if exists "Users can view household members for their households" on public.household_members;
drop policy if exists "Household admins can add members" on public.household_members;
drop policy if exists "Household admins can update members" on public.household_members;
drop policy if exists "Household admins can remove members" on public.household_members;
drop policy if exists "Users can view their households" on public.households;
drop policy if exists "Users can create households" on public.households;
drop policy if exists "Household admins can update households" on public.households;

create policy "Users can view household members for their households"
    on public.household_members for select
    using (public.current_user_is_household_member(household_id));

create policy "Household admins can add members"
    on public.household_members for insert
    with check (public.current_user_can_manage_household(household_id));

create policy "Household admins can update members"
    on public.household_members for update
    using (public.current_user_can_manage_household(household_id))
    with check (public.current_user_can_manage_household(household_id));

create policy "Household admins can remove members"
    on public.household_members for delete
    using (public.current_user_can_manage_household(household_id));

create policy "Users can view their households"
    on public.households for select
    using (public.current_user_is_household_member(id));

create policy "Users can create households"
    on public.households for insert
    with check (auth.uid() = created_by);

create policy "Household admins can update households"
    on public.households for update
    using (public.current_user_can_manage_household(id))
    with check (public.current_user_can_manage_household(id));

drop policy if exists "Users can insert their own properties" on public.properties;
drop policy if exists "Users can update their own properties" on public.properties;
drop policy if exists "Users can delete their own properties" on public.properties;

create policy "Users can insert properties into their households"
    on public.properties for insert
    with check (
        auth.uid() = user_id
        and (
            household_id is null
            or public.current_user_can_manage_household(household_id)
        )
    );

create policy "Users can update properties in their households"
    on public.properties for update
    using (public.current_user_owns_property(id))
    with check (public.current_user_owns_property(id));

create policy "Users can delete properties in their households"
    on public.properties for delete
    using (public.current_user_owns_property(id));

drop policy if exists "Owners can view contractor access for their areas" on public.contractor_area_access;

create policy "Owners can view contractor access for their areas"
    on public.contractor_area_access for select
    using (
        auth.uid() = owner_user_id
        or public.current_user_owns_area(area_id)
    );
