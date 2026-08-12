-- ============================================================================
-- 035_log_push_received_auth.sql
-- log-push-received passa a exigir JWT autenticado (não aceita mais anon key).
-- Grava o user_id para o admin correlacionar "push recebido" com o usuário.
-- ============================================================================

ALTER TABLE push_received_log ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_push_received_log_user_id ON push_received_log(user_id);