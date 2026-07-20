-- Harden sharing and destructive permissions for a public feedback beta.

create table if not exists public.property_collaborators (
    property_id uuid references public.properties(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text not null default 'member',
    status text not null default 'active',
    invited_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (property_id, user_id),
    constraint property_collaborators_role_check check (role in ('admin', 'member')),
    constraint property_collaborators_status_check check (status in ('active', 'revoked'))
);

create index if not exists property_collaborators_user_id_idx
    on public.property_collaborators(user_id);

alter table public.property_collaborators enable row level security;

create or replace function public.current_user_is_property_collaborator(
    p_property_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.property_collaborators pc
        where pc.property_id = p_property_id
        and pc.user_id = auth.uid()
        and pc.status = 'active'
    );
$$;

create or replace function public.current_user_can_manage_property(
    p_property_id uuid
)
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
            or exists (
                select 1
                from public.property_collaborators pc
                where pc.property_id = p.id
                and pc.user_id = auth.uid()
                and pc.role = 'admin'
                and pc.status = 'active'
            )
        )
    );
$$;

create or replace function public.current_user_can_manage_property_records(
    p_property_id uuid
)
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
            or public.current_user_is_property_collaborator(p.id)
        )
    );
$$;

create or replace function public.current_user_can_manage_area(p_area_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.areas a
        where a.id = p_area_id
        and public.current_user_can_manage_property(a.property_id)
    );
$$;

create or replace function public.current_user_owns_property(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.current_user_can_manage_property_records(p_property_id);
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
        where a.id = p_area_id
        and public.current_user_can_manage_property_records(a.property_id)
    );
$$;

create or replace function public.current_user_has_property_access(
    p_property_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.current_user_can_manage_property_records(p_property_id)
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
            or public.current_user_is_property_collaborator(p.id)
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
        if auth.uid() is not null
            and not public.current_user_can_manage_household(new.household_id)
        then
            raise exception 'You cannot create a property in this household';
        end if;

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

grant execute on function public.current_user_is_property_collaborator(uuid) to authenticated;
grant execute on function public.current_user_can_manage_property(uuid) to authenticated;
grant execute on function public.current_user_can_manage_property_records(uuid) to authenticated;
grant execute on function public.current_user_can_manage_area(uuid) to authenticated;

drop policy if exists "Users can view property collaborators" on public.property_collaborators;
drop policy if exists "Property admins can manage collaborators" on public.property_collaborators;

create policy "Users can view property collaborators"
    on public.property_collaborators for select
    using (
        user_id = auth.uid()
        or public.current_user_can_manage_property(property_id)
    );

create policy "Property admins can manage collaborators"
    on public.property_collaborators for all
    using (public.current_user_can_manage_property(property_id))
    with check (public.current_user_can_manage_property(property_id));

drop policy if exists "Users can update properties in their households"
    on public.properties;
drop policy if exists "Users can delete properties in their households"
    on public.properties;
drop policy if exists "Users can insert properties into their households"
    on public.properties;

create policy "Users can insert their own properties"
    on public.properties for insert
    with check (auth.uid() = user_id);

create policy "Property admins can update properties"
    on public.properties for update
    using (public.current_user_can_manage_property(id))
    with check (public.current_user_can_manage_property(id));

create policy "Property admins can delete properties"
    on public.properties for delete
    using (public.current_user_can_manage_property(id));

create or replace function public.prevent_direct_property_transfer()
returns trigger
language plpgsql
as $$
begin
    if auth.uid() is not null and (
        new.user_id is distinct from old.user_id
        or new.household_id is distinct from old.household_id
    ) then
        raise exception 'Use the transfer-property function to change property ownership';
    end if;

    return new;
end;
$$;

drop trigger if exists prevent_direct_property_transfer_before_update
    on public.properties;

create trigger prevent_direct_property_transfer_before_update
    before update on public.properties
    for each row
    execute function public.prevent_direct_property_transfer();

create or replace function public.preserve_contractor_verification_fields()
returns trigger
language plpgsql
as $$
begin
    if auth.uid() = new.user_id then
        new.verification_status = old.verification_status;
        new.verified_at = old.verified_at;
    end if;

    return new;
end;
$$;

drop trigger if exists preserve_contractor_verification_fields_before_update
    on public.contractor_profiles;

create trigger preserve_contractor_verification_fields_before_update
    before update on public.contractor_profiles
    for each row
    execute function public.preserve_contractor_verification_fields();

update public.contractor_profiles
set verification_status = 'unverified',
    verified_at = null
where verification_status = 'verified'
and verified_at is null;

update public.contractor_area_access
set verification_status = 'unverified'
where verification_status = 'verified';

create table if not exists public.user_usage (
    user_id uuid references auth.users(id) on delete cascade not null,
    period_start date not null,
    ai_plan_calls integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, period_start)
);

alter table public.user_usage enable row level security;

drop policy if exists "Users can view their own usage" on public.user_usage;

create policy "Users can view their own usage"
    on public.user_usage for select
    using (auth.uid() = user_id);

create or replace function public.consume_ai_plan_call(
    p_user_id uuid,
    p_period_start date,
    p_monthly_limit integer
)
returns table(allowed boolean, used integer, monthly_limit integer)
language plpgsql
security definer
set search_path = public
as $$
declare
    next_count integer;
begin
    insert into public.user_usage (user_id, period_start, ai_plan_calls)
    values (p_user_id, p_period_start, 0)
    on conflict (user_id, period_start) do nothing;

    update public.user_usage
    set ai_plan_calls = ai_plan_calls + 1,
        updated_at = timezone('utc'::text, now())
    where user_id = p_user_id
    and period_start = p_period_start
    and ai_plan_calls < p_monthly_limit
    returning ai_plan_calls into next_count;

    if next_count is null then
        select ai_plan_calls
        into next_count
        from public.user_usage
        where user_id = p_user_id
        and period_start = p_period_start;

        return query select false, coalesce(next_count, 0), p_monthly_limit;
        return;
    end if;

    return query select true, next_count, p_monthly_limit;
end;
$$;

grant execute on function public.consume_ai_plan_call(uuid, date, integer)
    to authenticated;
