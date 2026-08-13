-- ============================================================================
-- 037_require_aal2_for_admin_rls.sql
--
-- Fecha o bypass encontrado em 12/08: o "MFA obrigatório" do admin-app só
-- bloqueava a navegação na tela (React) — nenhuma policy RLS checava se a
-- sessão realmente completou o desafio de MFA (nível "aal2" do JWT). Uma
-- chamada direta à API com um token aal1 (só senha, sem o código de 6
-- dígitos) passava batido por qualquer regra de segurança daqui.
--
-- is_admin() (027) continua intocada de propósito: a tela de login precisa
-- dela ANTES do desafio de MFA, só para saber se deve pedir o código —
-- exigir aal2 ali criaria um paradoxo (nunca chegaria a aal2 pra descobrir
-- que precisa chegar a aal2). is_admin_aal2() é a nova trava, usada em toda
-- policy que dá acesso a dado sensível ou ação destrutiva.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_admin()
    AND coalesce((auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

REVOKE ALL ON FUNCTION public.is_admin_aal2() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_aal2() TO authenticated;

-- ----------------------------------------------------------------------------
-- admin_audit_log
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin read audit log" ON admin_audit_log;
CREATE POLICY "Admin read audit log"
  ON admin_audit_log FOR SELECT
  USING (public.is_admin_aal2());

-- ----------------------------------------------------------------------------
-- admin_notifications
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin delete notifications" ON admin_notifications;
CREATE POLICY "Admin delete notifications"
  ON admin_notifications FOR DELETE
  USING (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin insert notifications" ON admin_notifications;
CREATE POLICY "Admin insert notifications"
  ON admin_notifications FOR INSERT
  WITH CHECK (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin read notifications" ON admin_notifications;
CREATE POLICY "Admin read notifications"
  ON admin_notifications FOR SELECT
  USING (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin update notifications" ON admin_notifications;
CREATE POLICY "Admin update notifications"
  ON admin_notifications FOR UPDATE
  USING (public.is_admin_aal2());

-- ----------------------------------------------------------------------------
-- agent_config
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin modify agent_config" ON agent_config;
CREATE POLICY "Admin modify agent_config"
  ON agent_config FOR ALL
  USING (public.is_admin_aal2());

-- ----------------------------------------------------------------------------
-- chat_history / conversations (leitura admin)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin read chat_history" ON chat_history;
CREATE POLICY "Admin read chat_history"
  ON chat_history FOR SELECT
  USING (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin read conversations" ON conversations;
CREATE POLICY "Admin read conversations"
  ON conversations FOR SELECT
  USING (public.is_admin_aal2());

-- ----------------------------------------------------------------------------
-- error_logs
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin delete error_logs" ON error_logs;
CREATE POLICY "Admin delete error_logs"
  ON error_logs FOR DELETE
  USING (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin read error_logs" ON error_logs;
CREATE POLICY "Admin read error_logs"
  ON error_logs FOR SELECT
  USING (public.is_admin_aal2());

-- ----------------------------------------------------------------------------
-- knowledge_base (policies duplicadas historicamente — todas atualizadas)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin delete" ON knowledge_base;
CREATE POLICY "Admin delete"
  ON knowledge_base FOR DELETE
  USING (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin delete knowledge_base" ON knowledge_base;
CREATE POLICY "Admin delete knowledge_base"
  ON knowledge_base FOR DELETE
  USING (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin insert" ON knowledge_base;
CREATE POLICY "Admin insert"
  ON knowledge_base FOR INSERT
  WITH CHECK (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin insert knowledge_base" ON knowledge_base;
CREATE POLICY "Admin insert knowledge_base"
  ON knowledge_base FOR INSERT
  WITH CHECK (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin pode modificar knowledge_base" ON knowledge_base;
CREATE POLICY "Admin pode modificar knowledge_base"
  ON knowledge_base FOR ALL
  USING (public.is_admin_aal2())
  WITH CHECK (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin update" ON knowledge_base;
CREATE POLICY "Admin update"
  ON knowledge_base FOR UPDATE
  USING (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin update knowledge_base" ON knowledge_base;
CREATE POLICY "Admin update knowledge_base"
  ON knowledge_base FOR UPDATE
  USING (public.is_admin_aal2());

-- ----------------------------------------------------------------------------
-- profiles (leitura de todos os perfis — PII)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin read all profiles" ON profiles;
CREATE POLICY "Admin read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin_aal2());

-- ----------------------------------------------------------------------------
-- push_received_log
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin delete push_received_log" ON push_received_log;
CREATE POLICY "Admin delete push_received_log"
  ON push_received_log FOR DELETE
  USING (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin read push_received_log" ON push_received_log;
CREATE POLICY "Admin read push_received_log"
  ON push_received_log FOR SELECT
  USING (public.is_admin_aal2());

-- ----------------------------------------------------------------------------
-- push_subscriptions
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin delete push_subscriptions" ON push_subscriptions;
CREATE POLICY "Admin delete push_subscriptions"
  ON push_subscriptions FOR DELETE
  USING (public.is_admin_aal2());

DROP POLICY IF EXISTS "Admin read push_subscriptions" ON push_subscriptions;
CREATE POLICY "Admin read push_subscriptions"
  ON push_subscriptions FOR SELECT
  USING (public.is_admin_aal2());

-- ----------------------------------------------------------------------------
-- reading_progress
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin read reading_progress" ON reading_progress;
CREATE POLICY "Admin read reading_progress"
  ON reading_progress FOR SELECT
  USING (public.is_admin_aal2());
