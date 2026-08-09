-- ============================================================================
-- 031_admin_read_chats_and_lock_chat_role.sql
-- 1) O painel admin (admin-app) lê chat_history/conversations direto do
--    cliente com a anon key + JWT admin. Faltava policy de SELECT para
--    admin nessas tabelas: o painel só via os dados do próprio admin.
-- 2) RLS do chat_history permitia usuário inserir role='assistant'
--    (forjar respostas do agente no próprio histórico, envenenando o
--    contexto do LLM). A edge function grava respostas com service role
--    (ignora RLS), então restringir INSERT a role='user' não a afeta.
-- ============================================================================

DROP POLICY IF EXISTS "Admin read chat_history" ON chat_history;
CREATE POLICY "Admin read chat_history"
  ON chat_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "Admin read conversations" ON conversations;
CREATE POLICY "Admin read conversations"
  ON conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "User inserts own chat_history" ON chat_history;
CREATE POLICY "User inserts own chat_history"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'user');
