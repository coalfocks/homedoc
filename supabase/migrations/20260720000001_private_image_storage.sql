-- Lock image storage down before a public feedback beta. Existing public URLs
-- are converted back to object paths so the client can mint signed URLs.

update storage.buckets
set public = false
where id = 'images';

create or replace function public.private_image_object_path(value text)
returns text
language sql
immutable
as $$
    select case
        when value is null or value = '' then value
        when value like '%/storage/v1/object/public/images/%'
            then split_part(value, '/storage/v1/object/public/images/', 2)
        else value
    end;
$$;

update public.properties
set image_url = public.private_image_object_path(image_url)
where image_url like '%/storage/v1/object/public/images/%';

update public.areas
set image_url = public.private_image_object_path(image_url)
where image_url like '%/storage/v1/object/public/images/%';

update public.notes
set images = (
    select coalesce(array_agg(public.private_image_object_path(image_path)), '{}')
    from unnest(images) as image_path
)
where exists (
    select 1
    from unnest(images) as image_path
    where image_path like '%/storage/v1/object/public/images/%'
);

create or replace function public.uuid_path_segment(object_name text, segment_index int)
returns uuid
language plpgsql
immutable
as $$
declare
    segment text;
begin
    segment := split_part(object_name, '/', segment_index);
    if segment is null or segment = '' then
        return null;
    end if;

    return segment::uuid;
exception
    when invalid_text_representation then
        return null;
end;
$$;

create or replace function public.current_user_can_insert_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select case split_part(object_name, '/', 1)
        when 'properties' then public.current_user_owns_property(
            public.uuid_path_segment(object_name, 2)
        )
        when 'areas' then public.current_user_owns_property(
            public.uuid_path_segment(object_name, 2)
        )
        when 'notes' then public.current_user_has_area_access(
            public.uuid_path_segment(object_name, 2)
        )
        else split_part(object_name, '/', 1) = auth.uid()::text
    end;
$$;

create or replace function public.current_user_can_access_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.current_user_can_insert_image(object_name)
    or exists (
        select 1
        from public.properties p
        where p.image_url = object_name
        and public.current_user_has_property_access(p.id)
    )
    or exists (
        select 1
        from public.areas a
        where a.image_url = object_name
        and public.current_user_has_area_access(a.id)
    )
    or exists (
        select 1
        from public.notes n
        where object_name = any(n.images)
        and public.current_user_has_area_access(n.area_id)
    );
$$;

grant execute on function public.current_user_can_insert_image(text) to authenticated;
grant execute on function public.current_user_can_access_image(text) to authenticated;

drop policy if exists "Images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Users can update their own images" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;
drop policy if exists "Authenticated users can upload scoped images" on storage.objects;
drop policy if exists "Users can view accessible images" on storage.objects;
drop policy if exists "Users can update accessible images" on storage.objects;
drop policy if exists "Users can delete accessible images" on storage.objects;

create policy "Users can view accessible images"
    on storage.objects for select
    using (
        bucket_id = 'images'
        and auth.role() = 'authenticated'
        and public.current_user_can_access_image(name)
    );

create policy "Authenticated users can upload scoped images"
    on storage.objects for insert
    with check (
        bucket_id = 'images'
        and auth.role() = 'authenticated'
        and owner = auth.uid()
        and public.current_user_can_insert_image(name)
    );

create policy "Users can update accessible images"
    on storage.objects for update
    using (
        bucket_id = 'images'
        and owner = auth.uid()
        and public.current_user_can_access_image(name)
    )
    with check (
        bucket_id = 'images'
        and owner = auth.uid()
        and public.current_user_can_insert_image(name)
    );

create policy "Users can delete accessible images"
    on storage.objects for delete
    using (
        bucket_id = 'images'
        and owner = auth.uid()
        and public.current_user_can_access_image(name)
    );
