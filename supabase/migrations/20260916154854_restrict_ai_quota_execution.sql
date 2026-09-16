-- plan-todo verifies the user's identity and access, then consumes quota with
-- its service-role client. This SECURITY DEFINER RPC must never be a client API.
revoke execute on function public.consume_ai_plan_call(uuid, date, integer)
    from public, anon, authenticated;

grant execute on function public.consume_ai_plan_call(uuid, date, integer)
    to service_role;
