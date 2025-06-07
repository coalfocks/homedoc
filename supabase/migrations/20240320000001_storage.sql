-- Create storage bucket for images
insert into storage.buckets (id, name, public)
values ('images', 'images', true);

-- Create storage policies
create policy "Images are publicly accessible"
    on storage.objects for select
    using (bucket_id = 'images');

create policy "Authenticated users can upload images"
    on storage.objects for insert
    with check (
        bucket_id = 'images'
        and auth.role() = 'authenticated'
    );

create policy "Users can update their own images"
    on storage.objects for update
    using (
        bucket_id = 'images'
        and auth.uid() = owner
    );

create policy "Users can delete their own images"
    on storage.objects for delete
    using (
        bucket_id = 'images'
        and auth.uid() = owner
    ); 