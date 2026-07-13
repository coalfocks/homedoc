-- Household sharing is collaborative: members should be able to manage the
-- property record tree, not only view it. Keep member administration limited
-- to owner/admin roles, but allow household members to create/edit/delete
-- areas, notes, and todos for shared properties.

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
            or public.current_user_is_household_member(p.household_id)
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
            or public.current_user_is_household_member(p.household_id)
        )
    );
$$;
