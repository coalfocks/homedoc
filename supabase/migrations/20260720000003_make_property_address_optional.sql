-- The beta creation flow only requires a property name. Keep the database
-- contract aligned so first-run users can add address details later.

alter table public.properties
    alter column address_line_1 drop not null,
    alter column city drop not null,
    alter column state drop not null,
    alter column zip_code drop not null;
