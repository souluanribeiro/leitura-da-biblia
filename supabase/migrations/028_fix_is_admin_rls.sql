-- ============================================================================
-- 028_fix_is_admin_rls.sql
-- Correção definitiva do C1 no nível de RLS. O REVOKE de coluna da migração
-- 027 é mascarado pelo GRANT em nível de tabela que o Supabase aplica por
-- padrão; o controle efetivo é via WITH CHECK das políticas:
--   * UPDATE: só permite que is_admin permaneça com o valor já registrado.
--   * INSERT: só permite is_admin false/NULL ao criar o próprio perfil.
-- Promoção para admin passa a exigir service_role (admin-operations).
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin IS NOT DISTINCT FROM (
      SELECT profiles.is_admin
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND NOT COALESCE(is_admin, false));
