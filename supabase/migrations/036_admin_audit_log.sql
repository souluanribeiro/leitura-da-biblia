-- ============================================================================
-- 036_admin_audit_log.sql
-- Trilha de auditoria das ações sensíveis do admin: alterações no prompt do
-- agente, na base de conhecimento e em notificações (via triggers), além de
-- ações destrutivas das edge functions (admin-operations grava explicitamente).
-- Leitura/escrita: somente admin (RPC audit_admin_action valida is_admin) e
-- service role (edge functions).
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  detail TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON admin_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log (action);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read audit log" ON admin_audit_log;
CREATE POLICY "Admin read audit log"
  ON admin_audit_log FOR SELECT
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- Função de trigger: registra toda alteração feita por um admin autenticado
-- (ou pela service role, neste caso actor fica null) nas tabelas sensíveis.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_admin_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_action text;
  v_actor_id uuid := auth.uid();
  v_actor_email text;
  v_target_id text;
BEGIN
  v_target_id := COALESCE(
    (CASE WHEN NEW IS NOT NULL THEN NEW.id::text END),
    (CASE WHEN OLD IS NOT NULL THEN OLD.id::text END)
  );

  IF TG_OP = 'INSERT' THEN v_action := TG_ARGV[0] || '_insert';
  ELSIF TG_OP = 'UPDATE' THEN v_action := TG_ARGV[0] || '_update';
  ELSE v_action := TG_ARGV[0] || '_delete';
  END IF;

  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;

  INSERT INTO public.admin_audit_log (action, target_type, target_id, detail, actor_id, actor_email)
  VALUES (v_action, TG_TABLE_NAME, v_target_id, COALESCE(TG_ARGV[1], ''), v_actor_id, v_actor_email);

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.audit_admin_changes() FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- Triggers nas tabelas sensíveis
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_audit_agent_config ON agent_config;
CREATE TRIGGER trg_audit_agent_config
  AFTER INSERT OR UPDATE OR DELETE ON public.agent_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes('agent_config', '');

DROP TRIGGER IF EXISTS trg_audit_knowledge_base ON knowledge_base;
CREATE TRIGGER trg_audit_knowledge_base
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes('knowledge_base', '');

DROP TRIGGER IF EXISTS trg_audit_admin_notifications ON admin_notifications;
CREATE TRIGGER trg_audit_admin_notifications
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_notifications
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes('notification', '');

-- ----------------------------------------------------------------------------
-- RPC audit_admin_action(public) — grava ação arbitrária validando is_admin.
-- Usada por telas do admin quando preciso registrar algo além das triggers.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_admin_action(
  p_action text,
  p_target_type text,
  p_target_id text DEFAULT NULL,
  p_detail text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_email text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid() AND public.profiles.is_admin = true
  ) THEN
    RETURN false;
  END IF;

  SELECT email INTO v_actor_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.admin_audit_log (action, target_type, target_id, detail, actor_id, actor_email)
  VALUES (p_action, p_target_type, p_target_id, p_detail, auth.uid(), v_actor_email);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_admin_action FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_admin_action FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_admin_action TO authenticated;