-- Remove policies "Service role manages X" que foram criadas sem `TO service_role`.
-- Sem essa cláusula, USING(true)/WITH CHECK(true) valem para PUBLIC (qualquer usuário
-- autenticado), anulando por OR as policies "usuário só vê o próprio registro" das
-- mesmas tabelas. A service role key das Edge Functions já ignora RLS por padrão,
-- então essas policies nunca foram necessárias.

DROP POLICY IF EXISTS "Service role manages conversations" ON conversations;
DROP POLICY IF EXISTS "Service role manages chat_history" ON chat_history;

-- chat_history nunca teve policy de "usuário só vê o próprio" — adiciona agora.
CREATE POLICY "User sees own chat_history"
  ON chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User inserts own chat_history"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- agent_config: o frontend do app principal lê esta tabela pra exibir nome/foto/
-- descrição/sugestões do agente pra qualquer usuário (src/lib/bible-agent.ts),
-- então não dá pra restringir tudo a admin. Só a linha 'system_prompt' é sensível
-- (facilita extração/jailbreak do prompt) — essa fica restrita, o resto continua
-- público. A Edge Function do agente usa service role e não é afetada por RLS.
DROP POLICY IF EXISTS "Public read agent_config" ON agent_config;

CREATE POLICY "Public read agent_config except prompt"
  ON agent_config FOR SELECT
  USING (key <> 'system_prompt');
