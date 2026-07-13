-- Break RLS recursion introduced by contractor area access policies.
-- Policy subqueries that read properties/areas can recursively invoke policies on
-- those same tables. SECURITY DEFINER helpers evaluate the ownership/access chain
-- directly and keep table policies simple.

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
        and p.user_id = auth.uid()
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
        and p.user_id = auth.uid()
    );
$$;

create or replace function public.current_user_has_area_access(p_area_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.current_user_owns_area(p_area_id)
        or exists (
            select 1
            from public.contractor_area_access caa
            where caa.area_id = p_area_id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        );
$$;

create or replace function public.current_user_has_property_access(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.current_user_owns_property(p_property_id)
        or exists (
            select 1
            from public.contractor_area_access caa
            join public.areas a on a.id = caa.area_id
            where a.property_id = p_property_id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        );
$$;

grant execute on function public.current_user_owns_property(uuid) to authenticated;
grant execute on function public.current_user_owns_area(uuid) to authenticated;
grant execute on function public.current_user_has_area_access(uuid) to authenticated;
grant execute on function public.current_user_has_property_access(uuid) to authenticated;

drop policy if exists "Users can view their own properties" on public.properties;
drop policy if exists "Users can insert their own properties" on public.properties;
drop policy if exists "Users can update their own properties" on public.properties;
drop policy if exists "Users can delete their own properties" on public.properties;
drop policy if exists "Contractors can view assigned properties" on public.properties;

create policy "Users can view accessible properties"
    on public.properties for select
    using (public.current_user_has_property_access(id));

create policy "Users can insert their own properties"
    on public.properties for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own properties"
    on public.properties for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own properties"
    on public.properties for delete
    using (auth.uid() = user_id);

drop policy if exists "Users can view areas of their properties" on public.areas;
drop policy if exists "Users can insert areas to their properties" on public.areas;
drop policy if exists "Users can update areas of their properties" on public.areas;
drop policy if exists "Users can delete areas of their properties" on public.areas;
drop policy if exists "Contractors can view assigned areas" on public.areas;

create policy "Users can view accessible areas"
    on public.areas for select
    using (public.current_user_has_area_access(id));

create policy "Users can insert areas to their properties"
    on public.areas for insert
    with check (public.current_user_owns_property(property_id));

create policy "Users can update areas of their properties"
    on public.areas for update
    using (public.current_user_owns_area(id))
    with check (public.current_user_owns_property(property_id));

create policy "Users can delete areas of their properties"
    on public.areas for delete
    using (public.current_user_owns_area(id));

drop policy if exists "Users can view notes of their areas" on public.notes;
drop policy if exists "Users can insert notes to their areas" on public.notes;
drop policy if exists "Users can update notes of their areas" on public.notes;
drop policy if exists "Users can delete notes of their areas" on public.notes;
drop policy if exists "Contractors can view notes in assigned areas" on public.notes;
drop policy if exists "Contractors can add work notes to assigned areas" on public.notes;
drop policy if exists "Contractors can update their own work notes" on public.notes;

create policy "Users can view notes in accessible areas"
    on public.notes for select
    using (public.current_user_has_area_access(area_id));

create policy "Owners can insert notes to their areas"
    on public.notes for insert
    with check (public.current_user_owns_area(area_id));

create policy "Contractors can add work notes to assigned areas"
    on public.notes for insert
    with check (
        note_source = 'contractor'
        and contractor_user_id = auth.uid()
        and exists (
            select 1
            from public.contractor_area_access caa
            where caa.id = contractor_area_access_id
            and caa.area_id = notes.area_id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        )
    );

create policy "Owners can update notes of their areas"
    on public.notes for update
    using (public.current_user_owns_area(area_id))
    with check (public.current_user_owns_area(area_id));

create policy "Contractors can update their own work notes"
    on public.notes for update
    using (
        note_source = 'contractor'
        and contractor_user_id = auth.uid()
        and exists (
            select 1
            from public.contractor_area_access caa
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
            select 1
            from public.contractor_area_access caa
            where caa.id = notes.contractor_area_access_id
            and caa.area_id = notes.area_id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        )
    );

create policy "Users can delete notes of their areas"
    on public.notes for delete
    using (public.current_user_owns_area(area_id));

drop policy if exists "Users can view todos of their areas" on public.todos;
drop policy if exists "Users can insert todos to their areas" on public.todos;
drop policy if exists "Users can update todos of their areas" on public.todos;
drop policy if exists "Users can delete todos of their areas" on public.todos;

create policy "Users can view todos of their areas"
    on public.todos for select
    using (public.current_user_owns_area(area_id));

create policy "Users can insert todos to their areas"
    on public.todos for insert
    with check (public.current_user_owns_area(area_id));

create policy "Users can update todos of their areas"
    on public.todos for update
    using (public.current_user_owns_area(area_id))
    with check (public.current_user_owns_area(area_id));

create policy "Users can delete todos of their areas"
    on public.todos for delete
    using (public.current_user_owns_area(area_id));
