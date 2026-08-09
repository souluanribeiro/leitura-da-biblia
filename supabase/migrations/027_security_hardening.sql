-- ============================================================================
-- 027_security_hardening.sql
-- Correções de segurança do banco aplicadas após auditoria (de mais crítico
-- para menos crítico). Todas idempotentes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CRÍTICO: impedir que usuário comum promova a si mesmo a admin (C1)
--    A coluna is_admin vive em profiles e as políticas INSERT/UPDATE não
--    restringiam seu valor. Revogar a escrita da coluna nas roles usadas pelo
--    cliente é a correção definitiva (service_role não é afetada). Como
--    defesa em profundidade, adiciona WITH CHECK nas políticas de UPDATE.
-- ----------------------------------------------------------------------------
REVOKE UPDATE (is_admin) ON profiles FROM anon, authenticated;
REVOKE INSERT (is_admin) ON profiles FROM anon, authenticated;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. Harden da função is_admin() (A6): SECURITY DEFINER com search_path fixo
--    e nomes totalmente qualificados para evitar hijack de schema.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
      AND public.profiles.is_admin = true
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. RLS na push_received_log (A3): escrita apenas via edge function
--    (service_role ignora RLS); leitura/limpeza apenas por admin.
-- ----------------------------------------------------------------------------
ALTER TABLE push_received_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read push_received_log" ON push_received_log;
CREATE POLICY "Admin read push_received_log"
  ON push_received_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admin delete push_received_log" ON push_received_log;
CREATE POLICY "Admin delete push_received_log"
  ON push_received_log FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.is_admin = true
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Integridade: WITH CHECK em políticas de UPDATE que permitiam mudar o
--    user_id para outro usuário (e na push_subscriptions, política ALL sem
--    WITH CHECK podia aceitar INSERT com user_id alheio).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User updates own conversations" ON conversations;
CREATE POLICY "User updates own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own subscriptions" ON push_subscriptions;
CREATE POLICY "Users view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own subscriptions" ON push_subscriptions;
CREATE POLICY "Users update own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. CRÍTICO: proteger send-daily-reminder contra disparos não autorizados
--    (C2). O cron passa a enviar a service role key lida do Vault (sem chave
--    hardcoded nesta migração). A edge function passará a exigir essa chave
--    ou um JWT de admin (para ?test=1).
--    Ação manual única: criar o segredo no Vault com
--      select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role');
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS supabase_vault;

select cron.unschedule('send-daily-reminder-hourly')
where exists (select 1 from cron.job where jobname = 'send-daily-reminder-hourly');

select cron.schedule(
  'send-daily-reminder-hourly',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := 'https://lbgztfqgzjmiwvcghnki.supabase.co/functions/v1/send-daily-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', concat('Bearer ', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role')),
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role')
      ),
      body := '{}'
    ) as content_id;
  $$
);
