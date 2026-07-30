CREATE OR REPLACE FUNCTION debug_list_policies_temp()
RETURNS TABLE(tablename text, policyname text, cmd text, roles text, qual text, with_check text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tablename::text, policyname::text, cmd::text, roles::text, qual::text, with_check::text
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
$$;

GRANT EXECUTE ON FUNCTION debug_list_policies_temp() TO anon, authenticated;
