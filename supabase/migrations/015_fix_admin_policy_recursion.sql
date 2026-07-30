DROP POLICY IF EXISTS "Admin read all profiles" ON profiles;
CREATE POLICY "Admin read all profiles" ON profiles FOR SELECT
USING (public.is_admin());
