create table if not exists public.user_entitlements (
    user_id uuid primary key references auth.users(id) on delete cascade,
    plan text not null default 'free',
    status text not null default 'free',
    stripe_customer_id text unique,
    stripe_subscription_id text unique,
    stripe_price_id text,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists user_entitlements_stripe_customer_id_idx
    on public.user_entitlements(stripe_customer_id);

create index if not exists user_entitlements_status_idx
    on public.user_entitlements(status);

alter table public.user_entitlements enable row level security;

drop policy if exists "Users can view their own entitlement"
    on public.user_entitlements;

create policy "Users can view their own entitlement"
    on public.user_entitlements for select
    using (auth.uid() = user_id);

create or replace function public.touch_user_entitlements_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

drop trigger if exists touch_user_entitlements_updated_at
    on public.user_entitlements;

create trigger touch_user_entitlements_updated_at
    before update on public.user_entitlements
    for each row
    execute function public.touch_user_entitlements_updated_at();
