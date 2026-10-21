create table public.app_store_entitlements (
    user_id uuid primary key references auth.users(id) on delete cascade,
    status text not null check (status in ('active', 'expired')),
    product_id text not null check (length(btrim(product_id)) > 0),
    expires_at timestamptz,
    updated_at timestamptz not null,
    environment text not null check (environment in ('production', 'sandbox'))
);

alter table public.app_store_entitlements enable row level security;

revoke all on table public.app_store_entitlements from public, anon, authenticated;
grant select on table public.app_store_entitlements to authenticated;
grant select, insert, update, delete on table public.app_store_entitlements to service_role;

create policy "Users can view their own App Store entitlement"
    on public.app_store_entitlements for select
    to authenticated
    using ((select auth.uid()) = user_id);

create table public.beta_access (
    user_id uuid primary key references auth.users(id) on delete cascade,
    expires_at timestamptz
);

alter table public.beta_access enable row level security;

revoke all on table public.beta_access from public, anon, authenticated;
grant select on table public.beta_access to authenticated;
grant select, insert, update, delete on table public.beta_access to service_role;

create policy "Users can view their own beta access"
    on public.beta_access for select
    to authenticated
    using ((select auth.uid()) = user_id);

-- Existing beta accounts keep access until an explicit expiry is assigned.
insert into public.beta_access (user_id, expires_at)
select u.id, null
from auth.users as u
on conflict (user_id) do nothing;

create or replace function public.billing_access_for_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_now timestamptz := now();
    v_beta_access boolean := false;
    v_stripe_active boolean := false;
    v_stripe_period_end timestamptz;
    v_app_store_active boolean := false;
    v_app_store_period_end timestamptz;
    v_provider text := 'free';
    v_period_end timestamptz;
begin
    if p_user_id is null then
        raise exception using errcode = '22023', message = 'p_user_id is required';
    end if;

    select exists (
        select 1
        from public.beta_access as b
        where b.user_id = p_user_id
          and (b.expires_at is null or b.expires_at > v_now)
    )
    into v_beta_access;

    select e.current_period_end
    into v_stripe_period_end
    from public.user_entitlements as e
    where e.user_id = p_user_id
      and e.plan = 'pro'
      and e.status in ('active', 'trialing')
      and (e.current_period_end is null or e.current_period_end > v_now);
    v_stripe_active := found;

    select a.expires_at
    into v_app_store_period_end
    from public.app_store_entitlements as a
    where a.user_id = p_user_id
      and a.status = 'active'
      and a.expires_at > v_now;
    v_app_store_active := found;

    if v_app_store_active then
        v_provider := 'app_store';
        v_period_end := v_app_store_period_end;
    elsif v_stripe_active then
        v_provider := 'stripe';
        v_period_end := v_stripe_period_end;
    elsif v_beta_access then
        v_provider := 'beta';
        select b.expires_at
        into v_period_end
        from public.beta_access as b
        where b.user_id = p_user_id;
    end if;

    return pg_catalog.jsonb_build_object(
        'plan', case when v_beta_access or v_app_store_active or v_stripe_active then 'pro' else 'free' end,
        'status', case when v_beta_access or v_app_store_active or v_stripe_active then 'active' else 'free' end,
        'provider', v_provider,
        'current_period_end', v_period_end,
        'beta_access', v_beta_access
    );
end;
$function$;

revoke all on function public.billing_access_for_user(uuid) from public, anon, authenticated;
grant execute on function public.billing_access_for_user(uuid) to service_role;

create or replace function public.get_billing_access()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception using errcode = '28000', message = 'Authentication required';
    end if;

    return public.billing_access_for_user(v_user_id);
end;
$function$;

revoke all on function public.get_billing_access() from public, anon, authenticated;
grant execute on function public.get_billing_access() to authenticated;

create or replace function public.save_app_store_entitlement(
    p_user_id uuid,
    p_status text,
    p_product_id text,
    p_expires_at timestamptz,
    p_environment text,
    p_observed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
    if p_user_id is null then
        raise exception using errcode = '22023', message = 'p_user_id is required';
    end if;
    if p_status not in ('active', 'expired') then
        raise exception using errcode = '22023', message = 'Invalid App Store entitlement status';
    end if;
    if p_product_id is null or length(btrim(p_product_id)) = 0 then
        raise exception using errcode = '22023', message = 'p_product_id is required';
    end if;
    if p_environment not in ('production', 'sandbox') then
        raise exception using errcode = '22023', message = 'Invalid App Store environment';
    end if;
    if p_observed_at is null then
        raise exception using errcode = '22023', message = 'p_observed_at is required';
    end if;

    insert into public.app_store_entitlements (
        user_id, status, product_id, expires_at, environment, updated_at
    )
    values (
        p_user_id, p_status, p_product_id, p_expires_at, p_environment, p_observed_at
    )
    on conflict (user_id) do update
    set status = excluded.status,
        product_id = excluded.product_id,
        expires_at = excluded.expires_at,
        environment = excluded.environment,
        updated_at = excluded.updated_at
    where public.app_store_entitlements.updated_at <= excluded.updated_at;
end;
$function$;

revoke all on function public.save_app_store_entitlement(uuid, text, text, timestamptz, text, timestamptz)
    from public, anon, authenticated;
grant execute on function public.save_app_store_entitlement(uuid, text, text, timestamptz, text, timestamptz)
    to service_role;

create or replace function public.enforce_owned_property_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_access jsonb;
    v_authenticated_user_id uuid := auth.uid();
begin
    if new.user_id is null then
        return new;
    end if;

    if v_authenticated_user_id is not null
       and v_authenticated_user_id is distinct from new.user_id then
        raise exception using errcode = '42501', message = 'A property can only be created for the signed-in user';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(new.user_id::text, 0)
    );

    -- Allow a retry/upsert for the same owned row without treating it as a new property.
    if new.id is not null and exists (
        select 1
        from public.properties as p
        where p.id = new.id
          and p.user_id = new.user_id
    ) then
        return new;
    end if;

    v_access := public.billing_access_for_user(new.user_id);
    if v_access ->> 'plan' = 'pro' then
        return new;
    end if;

    if exists (
        select 1
        from public.properties as p
        where p.user_id = new.user_id
        limit 1
    ) then
        raise exception using errcode = 'P0001', message = 'The free plan allows one owned property';
    end if;

    return new;
end;
$function$;

revoke all on function public.enforce_owned_property_limit() from public, anon, authenticated, service_role;

drop trigger if exists enforce_owned_property_limit_before_insert on public.properties;
create trigger enforce_owned_property_limit_before_insert
    before insert on public.properties
    for each row
    execute function public.enforce_owned_property_limit();
