# Relatório de Sessão — 29/07/2026

> Resumo de tudo que foi analisado, corrigido e publicado nesta sessão, nos dois apps (`Leitura-da-Biblia` e `admin-app`). Destinado a dar contexto para quem continuar o trabalho.

---

## 1. Contexto inicial

A sessão começou com o relato de que o agente IA "Sheep" não respondia de forma inteligente e trocava as palavras dos textos bíblicos. Isso motivou uma auditoria completa dos dois aplicativos, que revelou problemas adicionais de segurança, bugs de dados e dívida técnica — todos corrigidos e publicados em produção nesta sessão.

---

## 2. Segurança — encontrado e corrigido

### 2.1 RLS aberta em `conversations`, `chat_history` e `agent_config` (crítico)

Qualquer usuário autenticado conseguia ler, editar ou apagar **conversas privadas de qualquer outro usuário**, e ler o system prompt do agente, via chamada direta à API do Supabase — sem precisar de acesso admin.

- **Causa:** policies `USING(true)` sem `TO service_role`, que no Postgres valem para todo mundo, não só a service role.
- **Migração 019** (`019_fix_open_rls_policies.sql`): removeu as policies abertas visíveis nos arquivos de migração.
- **Descoberta em cima da descoberta:** ao testar contra a API real (sem login), a falha continuava. Investigação direta em `pg_policies` (não nos arquivos) revelou **6 policies fantasma** — criadas fora de qualquer migração rastreada, algumas com nomes em português (`"Qualquer um pode ler agent_config"`, `"Service role modifica conversas"`, `"Service role chat"` etc.) — que replicavam o mesmo acesso irrestrito sob outro nome.
- **Migração 022** (`022_fix_shadow_open_policies.sql`): removeu as 6 policies fantasma e duplicatas redundantes.
- **Verificado ao vivo, sem autenticação, após a correção:** `conversations`, `chat_history` e o `system_prompt` de `agent_config` retornam vazio; `agent_name` (não sensível) continua público como deveria.
- **Migrações 020/021** foram uma função de diagnóstico temporária usada só para essa investigação (já removida pela 022).

**Lição para o futuro:** parte do schema do banco foi criada direto no Supabase (dashboard ou outra sessão) sem passar por migração — por isso os arquivos locais não contavam a história completa. Sempre que for auditar RLS, verificar `pg_policies` direto no banco, não só os arquivos `.sql`.

### 2.2 Dependências com CVE conhecido (não corrigido — decisão deliberada)

- App principal: `react-router` 7.12–8.2 tem vulnerabilidade alta (CSRF em modo RSC).
- admin-app: `react-router` 6.x tem duas vulnerabilidades moderadas (redirect e hidratação SSR).
- **Por que não corrigi:** ambas as falhas são específicas de modo SSR/RSC, que nenhum dos dois apps usa (são SPAs estáticas via Vite). A correção automática exigiria downgrade (app principal, `--force`, perderia 7 versões) ou bump de major version (admin-app) — risco de quebrar o app por uma vulnerabilidade que provavelmente não se aplica ao caso de uso real. Fica registrado para reavaliação futura.

---

## 3. Bugs de dados corrigidos

- **`schedule_id` ausente** em `ReadingDayPage.tsx`, `Stats.tsx` e `Sections.tsx` — o app suporta múltiplos planos de leitura simultâneos, mas essas três telas buscavam progresso sem filtrar por plano, misturando estatísticas e marcando dias como concluídos incorretamente entre planos diferentes.

---

## 4. PWA corrigido

- `manifest.json` e `sw.js` apontavam para `/icon-192.png` / `/icon-512.png`, mas os arquivos reais estão em `/icons/`. Ícone de instalação e de notificação push estavam quebrados — corrigido.
- Notificação de aniversário de batismo (`Dashboard.tsx`) usava `favicon.ico`, que não existe — trocado para o ícone real.
- **Cache do service worker:** o `index.html` era servido com estratégia stale-while-revalidate, o que podia entregar uma versão antiga referenciando bundles JS/CSS já removidos após um novo deploy (app quebrado até segundo reload). Trocado para network-first com fallback offline só quando realmente sem internet.

---

## 5. Qualidade de código

- Lógica de "marcar todos os capítulos como lidos" estava duplicada entre `Dashboard.tsx` e `ReadingDayPage.tsx` — extraída para `lib/reading-plan.ts` (`buildAllCheckedChapters`, `saveCheckedChapters`, `checkedChaptersStorageKey`).
- **admin-app:** praticamente todo save/delete ignorava erros do Supabase (UI mostrava "salvo com sucesso" mesmo em falha silenciosa). Adicionado tratamento de erro visível em `KnowledgeBase`, `PromptEditor`, `Settings`, `Notifications`, `ErrorLogs`, `Logs`.
- **admin-app `Settings.tsx`:** loop de 8 queries (select existente → update ou insert, por campo) consolidado em um único `upsert()`.
- **admin-app `PromptEditor.tsx`:** mesmo problema de upsert manual corrigido; adicionada validação para impedir salvar o prompt do agente vazio.
- **admin-app `Logs.tsx`:** carregava até 200 mensagens de todos os usuários de uma vez sem paginação. Adicionado carregamento incremental ("carregar mais", 100 por vez) e exibição de erro.

---

## 6. Agente IA "Sheep" — causa raiz dos sintomas relatados

Arquivo: `supabase/functions/bible-agent/index.ts`.

1. **"Respostas não inteligentes":** quando a busca na base de conhecimento encontrava algo, o código devolvia o texto bruto direto pro usuário, **sem passar pela IA**. Corrigido — agora o resultado da busca sempre vira contexto injetado no prompt, e a IA sempre formula a resposta final.
2. **"Muda as palavras dos textos bíblicos":** quando a busca não encontrava nada, o placeholder `{searchContext}` do prompt ficava vazio, forçando a IA a citar versículos de memória (e errar a redação). Corrigido junto com o item acima — agora sempre há um valor explícito no contexto (o resultado encontrado, ou um aviso claro de que nada foi encontrado), nunca string vazia.
3. **Variável de ambiente dessincronizada:** o código lia `Deno.env.get("GEMINI_API_KEYS")`, mas o secret real no Supabase tinha sido renomeado para `GROQ_API_KEYS` (fora desta sessão, no mesmo dia). Isso provavelmente já estava quebrando o agente em produção antes da correção. Corrigido para ler o nome certo.
4. Documentação (`CLAUDE.md`, `CONTEXTO.md`) atualizada para refletir o nome correto do secret.

**Deliberadamente não feito nesta sessão:** a reingestão da Bíblia verso-a-verso com busca vetorial (embeddings). Já existe infraestrutura para isso (migração `017_pgvector_knowledge_base.sql`, script `scripts/pdf_to_kb.py`, PDF da TNM em `scripts/pdfs/`), mas o chunking atual do script corta por parágrafo, não por versículo, e rodar a ingestão contra ~31 mil versículos em produção é uma operação de dados grande e semi-irreversível que merece sua própria passada com verificação — não algo para fazer às pressas dentro de um pedido de "aplicar tudo".

---

## 7. Git e deploy

- `supabase/functions/`, `scripts/` e `supabase/migrations/` — antes inteiramente fora de controle de versão — foram commitados no app principal.
- `admin-app` **nunca tinha sido um repositório git**. Inicializado (`git init`) e commitado pela primeira vez.
- `.gitignore` do app principal atualizado para excluir `scripts/.venv` e `scripts/pdfs` (o PDF da TNM não deve ir para o histórico do git — questão de direitos autorais ainda em aberto, ver `RELATORIO_AGENTE_IA.md`).
- Migrações 019–022 aplicadas em produção via `supabase db push`.
- Edge Function `bible-agent` publicada via `supabase functions deploy`.
- Ambos os frontends publicados em produção via `vercel --prod`:
  - https://leitura-da-biblia.vercel.app
  - https://admin-app-two-orcin.vercel.app
- Build e typecheck de ambos os apps verificados sem erro antes de cada deploy.

---

## 8. Pendências em aberto (para retomar depois)

| # | Item | Por que ficou de fora |
|---|------|------------------------|
| 1 | Reingestão da Bíblia verso-a-verso com busca vetorial (embeddings) | Operação grande de dados em produção, precisa de chunking novo + verificação própria |
| 2 | Remover scraping ao vivo do WOL (`fetchVerseFromWOL`) | Ainda é a única fonte real de texto de versículo até a reingestão acima estar pronta |
| 3 | CVEs de `react-router` em ambos os apps | Correção exigiria downgrade/major bump; vulnerabilidades são específicas de SSR/RSC, que os apps não usam |
| 4 | Cache de perguntas frequentes + limite diário por usuário no agente | Reduziria custo de IA em escala, mas é feature nova, não bug — não incluída na leva de correções |
| 5 | Confirmar uso do texto da TNM na base de conhecimento está dentro dos termos da Watchtower | Levantado, não resolvido — ver `RELATORIO_AGENTE_IA.md` |
| 6 | Auditoria de segurança externa/profissional | Recomendado antes de escalar para "milhares de usuários" — o que foi feito aqui foi revisão de código + teste de endpoints ao vivo, não um pentest formal |

---

## Arquivos-chave desta sessão

- `supabase/migrations/019_fix_open_rls_policies.sql`
- `supabase/migrations/022_fix_shadow_open_policies.sql`
- `supabase/functions/bible-agent/index.ts`
- `src/lib/reading-plan.ts`
- `src/pages/ReadingDayPage.tsx`, `Stats.tsx`, `Sections.tsx`, `Dashboard.tsx`
- `public/manifest.json`, `public/sw.js`
- `admin-app/src/pages/*.tsx` (KnowledgeBase, PromptEditor, Settings, Logs, Notifications, ErrorLogs)
- `.claude/RELATORIO_AGENTE_IA.md` (diagnóstico detalhado do agente, sessão anterior a esta)
