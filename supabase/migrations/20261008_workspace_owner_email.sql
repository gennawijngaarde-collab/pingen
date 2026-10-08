-- Email of the account that created the workspace (oldest auth user).
-- Used by the server as the fallback recipient for operational notifications
-- when ADMIN_EMAIL is not configured. Service role only.
CREATE OR REPLACE FUNCTION public.workspace_owner_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users
  WHERE email IS NOT NULL AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.workspace_owner_email() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_owner_email() TO service_role;
