-- These singular tables are legacy objects, not used by the current app.
-- Keep their schema/data intact, but deny direct client access. Preflight every
-- existing target before changing any table so an unexpected dependency state
-- fails closed and rolls the migration statement back atomically.
do $$
declare
    target_name text;
    target_oid oid;
    target_kind "char";
    has_rows boolean;
    has_policies boolean;
    target_names text[] := array['user', 'note', 'area', 'property'];
    checked_targets text[] := array[]::text[];
    service_role_privileges text[] := array[]::text[];
    privilege_name text;
    grant_entry text;
begin
    foreach target_name in array target_names loop
        target_oid := to_regclass(format('public.%I', target_name));

        if target_oid is null then
            raise notice 'Skipping absent legacy table public.%', target_name;
            continue;
        end if;

        select relkind
        into target_kind
        from pg_catalog.pg_class
        where oid = target_oid;

        if target_kind is null or target_kind not in ('r', 'p') then
            raise exception 'Expected public.% to be a table; found relation kind %',
                target_name, target_kind;
        end if;

        -- Serialize against writes and DDL before checking the table contents.
        -- Recheck identity after taking the name-based lock in case another
        -- transaction replaced the relation between lookup and lock acquisition.
        execute format(
            'lock table public.%I in access exclusive mode',
            target_name
        );

        if to_regclass(format('public.%I', target_name))::oid is distinct from target_oid then
            raise exception 'Refusing to harden public.% because it changed while acquiring its lock',
                target_name;
        end if;

        select relkind
        into target_kind
        from pg_catalog.pg_class
        where oid = target_oid;

        if target_kind is null or target_kind not in ('r', 'p') then
            raise exception 'Expected public.% to remain a table after locking; found relation kind %',
                target_name, target_kind;
        end if;

        select exists (
            select 1
            from pg_catalog.pg_policy
            where polrelid = target_oid
        )
        into has_policies;

        if has_policies then
            raise exception 'Refusing to harden public.% because it already has an RLS policy',
                target_name;
        end if;

        execute format(
            'select exists (select 1 from public.%I limit 1)',
            target_name
        ) into has_rows;

        if has_rows then
            raise exception 'Refusing to harden public.% because it is not empty',
                target_name;
        end if;

        -- Revoking PUBLIC can remove inherited rights from service_role.
        -- Preserve only its effective pre-migration privileges on each table.
        foreach privilege_name in array array[
            'SELECT', 'INSERT', 'UPDATE', 'DELETE',
            'TRUNCATE', 'REFERENCES', 'TRIGGER'
        ] loop
            if has_table_privilege('service_role', target_oid, privilege_name) then
                service_role_privileges := array_append(
                    service_role_privileges,
                    target_name || ':' || privilege_name
                );
            end if;
        end loop;

        checked_targets := array_append(checked_targets, target_name);
    end loop;

    foreach target_name in array checked_targets loop
        execute format(
            'alter table public.%I enable row level security',
            target_name
        );
        execute format(
            'revoke all privileges on table public.%I from PUBLIC, anon, authenticated',
            target_name
        );
    end loop;

    foreach grant_entry in array service_role_privileges loop
        target_name := split_part(grant_entry, ':', 1);
        privilege_name := split_part(grant_entry, ':', 2);
        execute format(
            'grant %s on table public.%I to service_role',
            privilege_name,
            target_name
        );
    end loop;
end
$$;
