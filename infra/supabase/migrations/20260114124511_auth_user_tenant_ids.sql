CREATE OR REPLACE FUNCTION auth_user_tenant_ids()
RETURNS TABLE (tenant_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tenant_id
    FROM tenant_members
    WHERE user_id = (select auth.uid());
$$;