-- A migração 019 corrigiu as policies abertas conhecidas a partir dos arquivos de
-- migração locais. Uma inspeção direta de pg_policies (não dos arquivos) revelou
-- que existem policies "fantasma" — criadas direto no banco, fora de qualquer
-- migração rastreada, algumas com nomes em português — que nunca apareceram nos
-- arquivos e portanto sobreviveram à 019, reabrindo o mesmo buraco sob outro nome:
--
--   agent_config: "Public read", "Qualquer um pode ler agent_config" (SELECT true)
--   chat_history: "Service role chat", "Service role modifica chat_history" (ALL true/true)
--   conversations: "Service role", "Service role modifica conversas" (ALL true/true)
--
-- Como policies permissivas se combinam por OR, bastava UMA dessas existir pra
-- anular as policies restritivas corretas na mesma tabela. Removendo todas agora.

DROP POLICY IF EXISTS "Public read" ON agent_config;
DROP POLICY IF EXISTS "Qualquer um pode ler agent_config" ON agent_config;

DROP POLICY IF EXISTS "Service role chat" ON chat_history;
DROP POLICY IF EXISTS "Service role modifica chat_history" ON chat_history;

DROP POLICY IF EXISTS "Service role" ON conversations;
DROP POLICY IF EXISTS "Service role modifica conversas" ON conversations;

-- Limpeza: duplicatas redundantes (não abrem buraco, mas são a mesma regra
-- repetida com nomes diferentes — mantém confuso e propenso a erro futuro).
DROP POLICY IF EXISTS "Admin modify" ON agent_config;
DROP POLICY IF EXISTS "Admin pode modificar agent_config" ON agent_config;

DROP POLICY IF EXISTS "Users can read own chat history" ON chat_history;
DROP POLICY IF EXISTS "Users can insert own chat history" ON chat_history;

DROP POLICY IF EXISTS "User creates own" ON conversations;
DROP POLICY IF EXISTS "User sees own" ON conversations;
DROP POLICY IF EXISTS "User updates own" ON conversations;
DROP POLICY IF EXISTS "Usuário cria suas conversas" ON conversations;
DROP POLICY IF EXISTS "Usuário edita suas conversas" ON conversations;
DROP POLICY IF EXISTS "Usuário vê suas conversas" ON conversations;

-- Remove a função de diagnóstico temporária usada pra inspecionar as policies
-- reais do banco (criada nas migrações 020/021, só para investigação).
DROP FUNCTION IF EXISTS debug_list_policies_temp();
