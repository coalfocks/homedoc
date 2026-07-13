-- PostgREST inserts use INSERT ... RETURNING for `.insert().select()`.
-- The previous area SELECT policy called current_user_has_area_access(id),
-- which looks the area up by ID. During INSERT RETURNING that lookup can fail
-- RLS visibility for the just-created row. Use the row's property_id directly
-- for owner/household access and keep contractor visibility scoped by area ID.

drop policy if exists "Users can view accessible areas" on public.areas;

create policy "Users can view accessible areas"
    on public.areas for select
    using (
        public.current_user_owns_property(property_id)
        or exists (
            select 1
            from public.contractor_area_access caa
            where caa.area_id = areas.id
            and caa.contractor_user_id = auth.uid()
            and caa.status = 'active'
        )
    );
