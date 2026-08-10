# Contexto — App Leitura da Bíblia

## Sobre
App de leitura bíblica em 366 dias, com identidade visual dark moderna, vídeos de introdução inline, checklist de capítulos, anotações pessoais e agente IA "Sheep". Inclui app administrativo para gerenciar o agente. Baseado no plano "Ler a Bíblia em 366 Dias" das Testemunhas de Jeová.

**Stack:** React + TypeScript + Vite + Supabase (auth + DB) + Vercel (deploy)

**URL App:** https://leitura-da-biblia.vercel.app
**URL Admin:** https://admin-app-two-orcin.vercel.app

**Deploy:** Auto-deploy via Git (desde 10/08). Push na `main` publica automaticamente nos dois projetos. Manual é opcional via `npx vercel --prod --yes`.

**GitHub:**
- App: https://github.com/souluanribeiro/leitura-da-biblia (branch `main`)
- Admin: https://github.com/souluanribeiro/admin-app (branch `main`)

**Pasta do projeto:** `Biblia-Em-1-Ano/`
- `Biblia-Em-1-Ano/Leitura-da-Biblia/` — app principal
- `Biblia-Em-1-Ano/admin-app/` — painel administrativo

---

## Identidade Visual

- **Fundo:** `#0f0f1a`
- **Cards:** `#1a1a2e`
- **Hover:** `#252540`
- **Ação (accent):** `#3b82f6` (azul)
- **Texto:** `#f0f0f5`
- **Muted:** `#8888aa`
- **Secundário (roxo):** `#5a3b87` / `purple-dim: rgba(90, 59, 135, 0.15)`
- **Emojis:** proibido (exceto marcadores 🔸🔹). Tudo com ícones `lucide-react`.
- **Tom da marca:** 50% acolhedor + 50% clareza. Sem hype, sem infantilizar.
- **Ícone do app (10/08):** imagem do usuário `leitura da bíblia.png` (200×200, fundo roxo sólido — TL 154,126,191 / BR 74,34,101). Gerados: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` e `favicon.png`, todos preenchidos com o roxo da imagem (**sem borda preta**, sem cantos transparentes). `favicon.svg` removido. Service worker em `leitura-v4`.
- **Service Worker:** Implementado (cache-first para wol.jw.org, network-first para Supabase)

---

## Marcadores

- **`'🔸'` (laranja):** textos sobre os Tratos de Deus com os Israelitas (Gênesis 4–50, Êxodo 1–21/31–40, Números 10–36, Deuteronômio 3–34, Josué, Juízes, Rute, 1–2 Samuel, 1–2 Reis, Esdras, Neemias, Ester)
- **`'🔹'` (azul):** textos sobre o Desenvolvimento da Congregação Cristã (Marcos e Atos)
- **`''` (sem marcador):** todos os outros dias (Levítico, Crônicas, Jó, Salmos, Provérbios, Profetas, NT exceto Marcos/Atos)
- **Tipo em `types.ts`:** `marker: '🔸' | '🔹' | ''`

---

## Seções

### Seções independentes (marcador-based, numeração própria 1, 2, 3...)
- **🔸Tratos de Deus com os Israelitas** — cor `#f97316`, só dias com 🔸
- **🔹Desenvolvimento da Congregação Cristã** — cor `#3b82f6`, só dias com 🔹

### Seções originais (por livro, 10 seções)
1. Escritos de Moisés (`#d4a853`, icon scroll)
2. Israel Entra na Terra Prometida (`#c0842f`, icon cookie)
3. Quando os Reis Governavam Israel (`#f59e0b`, icon crown)
4. Os Judeus Retornam do Exílio (`#dc2626`, icon house)
5. Cânticos e Sabedoria Prática (`#ef4444`, icon music)
6. Os Profetas (`#22c55e`, icon message-square)
7. Relatos da Vida de Jesus (`#3b82f6`, icon dove)
8. Crescimento da Congregação (`#6366f1`, icon users)
9. As Cartas de Paulo (`#a855f7`, icon mail)
10. Escritos de Outros Apóstolos (`#f97316`, icon pen-tool)

### Botões na página Seções
- **+N** (azul `bg-accent`, texto branco, bold) — expande mostra todos os dias
- **recolher** (roxo `bg-purple-600`, texto branco, bold, sem ícone) — recolhe para 20

---

## Funcionalidades Implementadas

### Dashboard
- Streak de dias seguidos com ícone `Flame` e pulse a cada 7 dias
- Anel de progresso SVG (arc) com % (sem texto "X/366" abaixo)
- Contador de dias lidos com ícone `CheckCircle`
- Botão "Estatísticas" no canto superior direito
- Card central com a leitura do dia (título, seção, marcador)
- Botão "Iniciar" navega para `/ler/{dia}`
- Botão "Concluir leitura" / "Leitura concluída"
- Seção "Dias anteriores" (colapsável, últimos 3 completados)
- Seção "Próximos dias" (3 não-completados à frente)
- Card de vídeo de introdução do livro (link externo JW.ORG)
- **Navegação Anterior/Próximo** — botões entre o anel e o card de leitura
- **Hoje sempre vai para a data atual**
- **Lembrete diário** com toggle, seletor de horário (7-20h)
- **Aniversário de batismo** — banner roxo quando é aniversário
- **Onboarding** multi-step: nome → idade → batizado → data → instruções → começar

### Página do Dia (`/ler/{dia}`)
- Lista de leituras do dia com título, seção, marcador
- **Player de vídeo inline** com introdução do livro via CDN JW.ORG
- **Checklist de capítulos** com checkbox + botão "Ler" ao lado
- **Barra de progresso** `X/total capítulos`
- Badge "Todos os capítulos lidos" quando completo
- Botão "Marcar lido" / "Concluído" no topo
- **Auto-completar** e **Auto-desmarcar**
- **Área de anotações** salvas no Supabase
- **Auto-save** nas anotações (debounce 1.5s)
- **Excluir anotação** e **Compartilhar**
- **Confetti** (30 partículas, 2s) ao completar dia

### Página de Perfil (`/perfil`)
- Avatar com upload de foto (200x200 JPEG, localStorage)
- Campos editáveis inline com auto-save
- Toggle de batismo com seletor de data
- Progresso de leitura detalhado
- Botão de sair

### Páginas
- `/` — Dashboard (Hoje)
- `/ler/{dia}` — Página de leitura do dia
- `/calendario` — Calendário (4 visões: mês, semana, dia, ano)
- `/secoes` — Seções da Bíblia
- `/notas` — Página de anotações com busca e filtros
- `/stats` — Estatísticas de leitura
- `/perfil` — Perfil do usuário
- `/agente` — AI Bible Agent (Sheep)
- `/instrucoes` — Instruções com links para Seções e marcadores

### Notas (`/notas`)
- Stats row: total, notas esta semana, livro mais anotado
- Busca por texto livre
- 3 seções de filtros expansíveis: Período, Seções, Livros
- Tags de filtro ativo com × para remover
- Cards com barra colorida, preview, excluir, compartilhar

### Estatísticas (`/stats`)
- Cards resumo: Sequência atual, melhor sequência, dias lidos, anotações
- Gráfico de barras por dia da semana e por mês
- Progresso por seção com barras coloridas
- Mapa de calor: grid 7×5 últimos 30 dias

### AI Bible Agent "Sheep" (`/agente`)
- **Edge Function:** `supabase/functions/bible-agent/index.ts`
- **IA:** Groq API (modelo `llama-3.3-70b-versatile`)
- **Rotação de API keys:** múltiplas keys no env `GROQ_API_KEYS` (separadas por vírgula)
- **Prompt = 100% do admin-app:** lido de `agent_config.system_prompt`. **Não existe prompt padrão no código.** Prompt vazio → agente responde que precisa de configuração.
- **Fontes = 100% do admin-app:** busca **somente** na tabela `knowledge_base` via RPC `search_knowledge_base_fts` (FTS v2, OR de termos com ranking). **Sem scraping WOL, sem busca em `verses`.**
- **Placeholders do prompt (opcionais):** `{userName}`, `{userStatus}`, `{dayNumber}`, `{readingContext}`, `{userNotes}`, `{searchContext}`, `{agentName}`. Contexto só é buscado se o prompt usar o placeholder.
- **Auth obrigatória:** edge function valida JWT do usuário (401 sem token) + CORS restrito.
- **Conversas:** tabela `conversations` com soft delete e arquivamento
- **Histórico:** tabela `chat_history` com `conversation_id` para agrupar mensagens
- **Interface:** sidebar estilo ChatGPT com lista de conversas, criar/excluir
- **Foto e nome do agente:** editáveis no admin-app, salvos em `agent_config`
- **Descrição do agente:** editável no admin-app, exibida centralizada no chat
- **Sugestões iniciais:** editáveis no admin-app, só exibem se houver
- **Foto do usuário:** exibida ao lado das mensagens (ou inicial do nome)
- **Layout responsivo:** header fixo, input sempre visível, conteúdo scrollável
- **~4 segundos** de resposta média

### Admin App (`admin-app/`)
- **URL:** https://admin-app-two-orcin.vercel.app (projeto Vercel: `admin-app`)
- **Páginas:** Login, Dashboard, Knowledge Base, Prompt Editor, Logs, Erros, Push, Leituras, Disparar, Configurações
- **Settings:** Foto do agente (base64), nome, descrição, sugestões
- **Knowledge Base:** CRUD de artigos com título, conteúdo, keywords — **única fonte de conhecimento do Sheep**
- **Prompt Editor:** Edição do system prompt do agente (com dica de placeholders)
- **Logs:** Histórico de conversas (paginação por cursor)
- **Erros:** `error_logs` com paginação e checagem `res.ok`
- **Push:** lista `push_subscriptions` com **e-mail do usuário**, abas Ativas/Inativas, botão de limpar inscrições antigas
- **Leituras:** estatísticas de leitura dos usuários
- **Disparar:** envio manual de notificações admin
- **Acesso:** restrito a usuários com `profiles.is_admin = true`

### Admin user
- **E-mail:** `luanribeiroterapeuta@gmail.com`
- **id no projeto `lbgztfqgzjmiwvcghnki`:** `417e9bba-583e-454f-bf04-40cfd127f3af` — **use SEMPRE este id** (o id `7446cd05-...` é de outro projeto e não existe aqui)
- **Confirmar admin:** `UPDATE profiles SET is_admin = true WHERE id = '417e9bba-583e-454f-bf04-40cfd127f3af';`
- **Reset de senha (SQL Editor do `lbgztfqgzjmiwvcghnki`):** `UPDATE auth.users SET encrypted_password = crypt('SENHA', gen_salt('bf', 10)), updated_at = now() WHERE id = '417e9bba-583e-454f-bf04-40cfd127f3af';`
- Usuário loga no app com **Google** (conta sem senha de e-mail originalmente); o admin-app usa email/senha, então a senha precisa ser definida via SQL.

### Autenticação
- Google OAuth + email/senha via Supabase
- ProtectedRoute + Layout wrapper
- Toggle de visibilidade da senha
- Link "Esqueceu a senha?" → modo redefinição com email
- **Em 09/08:** login do admin-app parou com "Email ou senha incorretos" porque a senha havia sido definida no projeto errado. Corrigido resetando a senha no projeto `lbgztfqgzjmiwvcghnki`. Depois deu "Acesso restrito apenas para administradores" porque o `is_admin` foi aplicado com o id errado (`7446cd05...` do projeto antigo). Corrigido aplicando no id correto (`417e9bba-...`).

### API de Vídeos
- `src/lib/jw-media.ts`: busca `GETPUBMEDIALINKS` da API pública JW.ORG
- Cache em memória, retorna URL MP4 da melhor qualidade

### Notificações Push
- `src/lib/push.ts` + Supabase edge function `send-daily-reminder`
- VAPID keys no `.env`
- **Cron** `send-daily-reminder-hourly` (`0 * * * *`) via pg_cron + pg_net, usando `CRON_SECRET` do Vault (migrations 029/030) — não usa mais a service role key
- **Inscrição grava `user_email`** (migration 032) para o admin mostrar e-mail em vez de uuid
- **Admin pode excluir** inscrições antigas/inativas (policy 032)
- **Agendamento (10/08):** nova edge function `send-scheduled-notifications` processa `admin_notifications` com `status='pending'` e `scheduled_at <= now()`. Cron `*/5 * * * *` (migration 033) com `CRON_SECRET` do Vault. ⚠️ **fix importante:** função deployada com `verify_jwt=false` no config.toml (default era `true`, cron recebia 401 e nunca executava — corrigido e testado 200 OK)

### Compartilhar
- `src/lib/share.ts`: Web Share API com fallback para clipboard

### Offline
- `public/sw.js`: service worker simples
- Cache-first para app shell + wol.jw.org
- Network-first para Supabase

---

## Navegação (Bottom Nav — 5 abas, Hoje no centro)
- Calendário (`/calendario`) — ícone CalendarDays
- Seções (`/secoes`) — ícone LayoutGrid
- Hoje (`/`) — ícone Home (centro, destaque)
- Notas (`/notas`) — ícone StickyNote
- Instruções (`/instrucoes`) — ícone GraduationCap

---

## Supabase

- **Projeto:** `lbgztfqgzjmiwvcghnki`
- **Tabelas:** `reading_progress`, `notes`, `push_subscriptions` (com `user_email`), `profiles` (com `reading_start_date`, `is_admin`, foto/nome/idade/batismo), `chat_history` (com `conversation_id`), `conversations`, `knowledge_base`, `agent_config`, `error_logs`, `push_received_log`, `admin_notifications`
- **Edge Functions (6):** `bible-agent` (`verify_jwt=true`), `send-daily-reminder` (`verify_jwt=false`, cron com CRON_SECRET), `admin-operations` (`verify_jwt=false` com auth+admin check manual), `send-admin-notification` (`verify_jwt=false` com auth+admin check manual), `log-push-received` (`verify_jwt=false`), `send-scheduled-notifications` (`verify_jwt=false` — fix 10/08, antes 401 no cron)
- **Auth trigger:** cria perfil automaticamente no signup
- **Rotação de chaves Supabase em 09/08:** chaves da API (incluindo anon) foram rotacionadas — anon key atual no `.env` e no Vercel; precisa de redeploy se rotacionar de novo
- **Extensões:** `pg_cron`, `pg_net`, `supabase_vault`

### Migrations (tudo aplicado no `lbgztfqgzjmiwvcghnki`)
- `002_add_reading_start_date.sql`
- `003_add_chat_history.sql`
- `004_knowledge_base.sql` — tabela knowledge_base + RLS admin
- `005_agent_config.sql` — tabela agent_config + is_admin no profiles
- `006_conversations.sql` — tabela conversations + conversation_id no chat_history
- `018_knowledge_base_fts.sql` — search_vector + RPC FTS (v1, plainto_tsquery)
- `023_knowledge_base_fts_v2_and_trigger.sql` — FTS v2 (OR de termos) + trigger de search_vector
- `027_security_hardening.sql` — REVOKE is_admin de anon/authenticated, is_admin() SECURITY DEFINER com search_path fixo, RLS em push_received_log, WITH CHECK em notes/conversations/push_subscriptions, cron com Vault
- `028_fix_is_admin_rls.sql` — correção definitiva: is_admin não pode mudar via UPDATE do usuário; promoção exige service_role
- `029_cron_secret.sql` — troca o segredo do cron para `CRON_SECRET` no Vault (privilégio mínimo)
- `030_install_pg_net.sql` — instala a extensão pg_net
- `031_admin_read_chats_and_lock_chat_role.sql` — admin lê chat_history/conversations; INSERT de chat_history restrito a role='user' (bloqueia forjar resposta do agente)
- `032_push_subscriptions_email_admin.sql` — coluna user_email + backfill + policy de DELETE para admin
- `033_send_scheduled_notifications_cron.sql` — cron `*/5 * * * *` chamando `send-scheduled-notifications` com `CRON_SECRET` do Vault
- `034_atomic_rate_limit_rpc.sql` — RPC `log_user_message` (SECURITY DEFINER, `search_path=''`, `pg_advisory_xact_lock`, só `service_role`): contagem + INSERT atômicos; `checkRateLimit` removido do bible-agent

---

## API Keys e Segredos

- **Groq API Key:** armazenada como secret `GROQ_API_KEYS` (10 keys, separadas por vírgula)
- **Modelo:** `llama-3.3-70b-versatile` (Groq)
- **IMPORTANTE (09/08):** o 429 "Muitas requisições" era **limite por ORGANIZAÇÃO GROQ** (`org_01kygrqb29f78svf47nv7qwed4`), não por key — as 10 keys compartilham o mesmo balde de **8.000 TPM/min**. Rotação de key não multiplica o limite. Para aumentar é preciso outra conta/org ou plano pago.
- **Ajustes para caber no TPM (commit `dc2f373`):** respostas até ~600 tokens (antes 2048) e memória de conversa dos últimos **8** msgs (era 16). Trade-off: respostas longas podem truncar, mas as curtas do dia a dia ficam intactas.
- **Rate limit handling:** retry automático com próxima key em caso de 429 (com backoff)
- **Vault (Supabase):** `CRON_SECRET` usado pelo cron de push (privilégio mínimo)

---

## Decisões de Implementação

1. **Service Worker:** cache-first estáticos, network-first Supabase, cache-first wol.jw.org
2. **Current day:** `getReadingDayForDate(new Date())` com fallback
3. **Checkbox state em localStorage:** `checked_{dayNum}`
4. **Conclusão two-way:** Dashboard ↔ Página do Dia
5. **Vídeos inline:** `<video>` nativo com controls
6. **Seções de marcador independentes:** filtram por marker, numeração própria
7. **+N expansível:** botão azul bold; recolher roxo bold
8. **Excluir notas:** com confirmação
9. **Hoje sempre data atual**
10. **Ícone/Favicon (10/08):** imagem enviada pelo usuário — PWA icons (192/512/maskable) + `favicon.png`; `favicon.svg` removido
11. **Foto de perfil:** comprimida 200x200 JPEG, localStorage
12. **Onboarding:** multi-step com persistência
13. **Bíblia copyright:** links externos para wol.jw.org
14. **Baptism anniversary:** banner + notificação
15. **Agente IA:** Groq (não Gemini) com rotação de keys para evitar rate limit — mas o limite real é por **organização** (8.000 TPM compartilhado entre todas as keys)
16. **Controle total do agente:** prompt 100% do admin (sem prompt padrão no código) e fontes 100% do admin (knowledge_base, sem WOL). Ver `RELATORIO_SESSAO_2026-08-03.md`
17. **Busca na base:** FTS v2 com OR de termos (tolerante a linguagem natural); trigger mantém `search_vector` atualizado ao editar artigos no admin
18. **Auditoria v2 (09/08):** 11 itens de segurança corrigidos e deployados — prompt injection no agente, role `assistant` que podia ser forjada via RLS (migration 031), admin não lia conversas, máquina de estados das notificações, CSP sem `unsafe-inline`, etc.
19. **Login admin-app:** sempre conferir o **id do usuário no projeto correto** (`lbgztfqgzjmiwvcghnki` = `417e9bba-...`); o antigo `7446cd05-...` pertence ao projeto `iqtqtxlqzveixxxunnvj`
20. **Auto-deploy Git (10/08):** Vercel conectado aos dois repos GitHub (`leitura-da-biblia` e `admin-app`). Push em `main` publica automaticamente. `.gitignore` ignora `.vercel` e `.env*`.
21. **Cron de agendamento (10/08):** `send-scheduled-notifications` com `verify_jwt=false` (obrigatório — default `true` causa 401 porque o cron não envia JWT real)
22. **Rate limit atômico (10/08):** RPC `log_user_message` substitui o `checkRateLimit` no código; `saveChatMessage` mantido só para resposta do assistant

---

## Arquivos Principais

### Leitura da Bíblia
- `src/pages/BibleAgent.tsx` — Interface do chat com sidebar, conversas, sugestões
- `src/pages/Dashboard.tsx` — Dashboard com streak, progresso, marcadores, onboarding
- `src/pages/ReadingDayPage.tsx` — Checklist, vídeo, anotações auto-save
- `src/pages/Profile.tsx` — Perfil do usuário com foto, dados, progresso
- `src/pages/Sections.tsx` — Seções de marcador + seções de livros
- `src/pages/Notes.tsx` — Página de anotações com busca e filtros
- `src/pages/Stats.tsx` — Estatísticas de leitura
- `src/pages/Calendar.tsx` — Calendário 4 visões
- `src/pages/Login.tsx` — Google OAuth + email/senha
- `src/components/Layout.tsx` — Header + Bottom nav
- `src/lib/bible-agent.ts` — Funções CRUD conversas, mensagens, config do agente
- `src/lib/reading-plan.ts` — Plano 366 dias, 12 seções, marcadores
- `src/lib/jw-media.ts` — API de vídeos JW.ORG
- `src/lib/push.ts` — Notificações push
- `src/lib/share.ts` — Web Share API
- `src/lib/user-profile.ts` — Perfil do usuário
- `src/lib/supabase.ts` — Cliente Supabase
- `supabase/functions/bible-agent/index.ts` — Edge Function com Groq + knowledge_base (prompt 100% admin)
- `supabase/functions/send-daily-reminder/index.ts` — Edge Function lembretes (cron)
- `supabase/functions/admin-operations/index.ts` — Edge Function operações de admin (auth+is_admin manual)
- `supabase/functions/send-admin-notification/index.ts` — Edge Function push notifications para admin (usa `_shared/push.ts`)
- `supabase/functions/send-scheduled-notifications/index.ts` — Edge Function de notificações agendadas (cron `*/5 * * * *`)
- `supabase/functions/_shared/push.ts` — lógica compartilhada `sendNotificationById` (extraído em 10/08)
- `supabase/functions/log-push-received/index.ts` — log de push recebido (sem `LEGACY_ANON_KEY`)
- `public/icons/` — `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
- `public/favicon.png` — favicon do navegador
- `supabase/migrations/004_knowledge_base.sql`
- `supabase/migrations/005_agent_config.sql`
- `supabase/migrations/006_conversations.sql`
- `supabase/migrations/023_knowledge_base_fts_v2_and_trigger.sql`

### Admin App
- `src/pages/Settings.tsx` — Foto, nome, descrição, sugestões do agente
- `src/pages/KnowledgeBase.tsx` — CRUD de artigos
- `src/pages/PromptEditor.tsx` — Editor do system prompt
- `src/pages/Logs.tsx` — Histórico de conversas (paginação por cursor)
- `src/pages/ErrorLogs.tsx` — Logs de erro
- `src/pages/PushNotifications.tsx` — Push com e-mail, abas Ativas/Inativas, limpar antigas
- `src/pages/Notifications.tsx` — Disparo de notificações admin
- `src/pages/ReadingStats.tsx` — Estatísticas de leitura
- `src/pages/Dashboard.tsx` — Stats do admin
- `src/pages/Login.tsx` — Login com Google + email/senha
- `src/components/Layout.tsx` — Sidebar de navegação
- `src/lib/supabase.ts` — Cliente Supabase (projeto `lbgztfqgzjmiwvcghnki`)

---

*Última atualização: 10/08/2026*

## Estado recente (10/08/2026)

### Leitura da Bíblia — últimos commits (`main`)
- `6e5e375` — **Auditoria de lançamento:** CSP libera vídeos JW (`media-src`/`img-src`/`connect-src` para `*.jw-cdn.org`), `getChaptersList` corrigido (dias "Salmo 119 (X–Y)" geravam lista vazia), remove `.github/workflows/daily-reminder.yml` (redundante e quebrado — enviava service_role em função que agora exige CRON_SECRET; o cron do Supabase 027 cobre o envio)
- `ee27e1a` — Fix: alinha "Leitura atual" com os títulos das leituras (`pl-3`)
- `a1925da` — Fix: ícone sem borda preta (fundo roxo) e alinha "Leitura atual" (`pl-7`)
- `eedd01b` — Botão da página de leitura vira "Concluir" (era "Marcar como lido")
- `5ca67fa` — Novo ícone (bíblia roxa) no PWA, favicon e login; remove ícone do card "Leitura atual"; SW `leitura-v3`
- `8cb5ce2` — Docs: atualiza CONTEXTO e regras (auto-deploy, fix cron 401, ícone, migrations 033/034)
- `9380a90` — Imagem do ícone na tela de login
- `b1b6305` — Novo ícone do app (PWA, favicon e máscara) a partir da imagem enviada
- `ba4f645` — Fix: `verify_jwt=false` em `send-scheduled-notifications` (cron usava 401)
- `6be6a6c` — Ignora `.vercel` e `.env*` (vínculo Git com Vercel)
- `f000bb3` — Auditoria v3: agendamento de notificações, rate limit atômico, remove chave legada, fecha vazamento de contexto entre conversas
- `f33d3f7` — Push: grava `user_email` na inscrição + migration 032
- `dc2f373` — Sheep: max_tokens 600, histórico 8 msgs, KB 4 fontes, backoff 429
- `6d6a983` — Auditoria v2: prompt injection, estados de notificação, LGPD, RLS, paginação, CSP

### admin-app — últimos commits (`main`)
- `2a7008f` — Push: mostra e-mail do usuário, abas Ativas/Inativas, botão limpar inscrições antigas
- `e4c2e0d` — Auditoria v2: JSON.parse seguro, res.ok, paginação por cursor, CSP, MIME avatar, signOut seguro
- `9f1c467` — Admin: campos de limite diário e por minuto do Sheep
- `cca2fa4` — Logs mostram e-mail do usuário

### Resumo 10/08 — auditoria v3 + deploy + integração
1. **Auditoria v3 (commit `f000bb3`):** RLS e edge functions revisados (considerados sólidos); extraiu envio de push para `_shared/push.ts`; nova função `send-scheduled-notifications`; RPC atômica `log_user_message` (migration 034) com `pg_advisory_xact_lock`; removida `LEGACY_ANON_KEY`; `fetchChatHistory` retorna `[]` sem `conversationId`.
2. **Supabase:** 3 edge functions redeployadas; migrations 033 (cron) e 034 (RPC) aplicadas e verificadas. Cron `*/5 * * * *` ativo.
3. **Bug crítico corrigido:** `send-scheduled-notifications` deployada com `verify_jwt=true` (default) → cron recebia **401** e nada era processado. Fix no `config.toml` (`verify_jwt=false`), redeploy e teste manual com `CRON_SECRET` → **200 OK** (`{"processed":0,"results":[]}`).
4. **Vercel:** integração Git conectada nos DOIS projetos. Teste real de auto-deploy OK (commits `6be6a6c` e `ba4f645` publicados automaticamente).
5. **Ícone do app:** imagem enviada pelo usuário aplicada em PWA (192/512/maskable), favicon e tela de login. Service worker bump para `leitura-v2`.
6. **Pendência de teste:** `push_subscriptions` está vazia (0 inscritos) — envio real de notificação não pode ser validado até haver dispositivo inscrito.

### Auditoria de lançamento (10/08, commit `6e5e375`) — "posso divulgar?"
**Resultado: SIM, pronto para divulgar.** Tudo verificado e corrigido nesta sessão:
- **CSP consertado (`vercel.json`):** vídeos de introdução JW vinham de `cfp2.jw-cdn.org` (MP4) e a API de `b.jw-cdn.org`, mas o CSP só permitia `'self'` → o vídeo embutido nunca carregava em produção (degradava para o link externo). Adicionado `media-src https://*.jw-cdn.org blob:`, `img-src https://*.jw-cdn.org` (poster .jpg) e `connect-src https://*.jw-cdn.org`.
- **Bug Salmo 119 (`getChaptersList`, `src/lib/reading-plan.ts`):** dias `Salmo 119 (1–8)` etc. (dias 306–327) tinham `chapters: '119:1-8'` → parse gerava lista vazia (sem caixas de capítulo, barra de progresso quebrada). Corrigido: quando só o início tem `:cap`, o fim herda o mesmo capítulo.
- **Workflow do GitHub removido:** `daily-reminder.yml` enviava `service_role` via header mas `send-daily-reminder` exige `CRON_SECRET` (desde 027) → falhava 403 a cada hora. Removido; o cron do Supabase (027) é a fonte única do lembrete diário.
- **Segurança testada ao vivo (anon key):** RLS OK — anon vê `[]` em `profiles`, `reading_progress`, `chat_history`, `conversations`, `notes`, `push_subscriptions`, `admin_notifications`, `push_received_log`; `agent_config` expõe só nome/avatar/descrição (nunca `system_prompt`); `knowledge_base` e RPC FTS não vazam conteúdo ao anon.
- **Edge functions testadas:** sem token → 401/403 corretos em `bible-agent`, `admin-operations`, `send-admin-notification`, `send-daily-reminder`, `send-scheduled-notifications`, `log-push-received`; origem falsa → 403.
- **Build:** `npm run build` OK (tsc + vite).
- **Migrations:** todas aplicadas (001–034) no `lbgztfqgzjmiwvcghnki`.
- **SW:** `leitura-v4` (bump por causa do ícone novo).

### Ajustes visuais da sessão (10/08, commits `a1925da`, `ee27e1a`)
- Ícone do app regenerado direto da imagem do usuário (`leitura da bíblia.png`, 200×200 fundo roxo sólido) — **sem borda preta** (o problema era o fundo `#0f0f1a` do maskable + transparência do SVG anterior).
- Dashboard: removido o `<img>` do card "Leitura atual"; título com `pl-3` (12px) para alinhar exatamente com os títulos das leituras (padding 16px + gap-3 12px = 28px dos dois lados).
- Login continua usando `/icons/icon-192.png`.

## Estado recente (09/08/2026)

### Leitura da Bíblia — últimos commits (`main`)
- `f33d3f7` — Push: grava `user_email` na inscrição + migration 032 (coluna + backfill + policy DELETE admin)
- `dc2f373` — Sheep: `max_tokens 600`, histórico 8 msgs, KB 4 fontes, backoff com retry-after no 429 (limite por org GROQ)
- `6d6a983` — Auditoria v2: prompt injection, estados de notificação, LGPD delete_user, RLS admin lê chats, paginação, CSP, backup de checkmarks
- `d16498d` — Instala pg_net (cron do send-daily-reminder falhava sem schema `net`)
- `3a60c4f` — Auditoria de segurança: RLS hardened, cron com CRON_SECRET no Vault, auth em edge functions, fixes do frontend

### admin-app — últimos commits (`main`)
- `2a7008f` — Push: mostra e-mail do usuário, abas Ativas/Inativas, botão limpar inscrições antigas
- `e4c2e0d` — Auditoria v2: JSON.parse seguro, res.ok nas ações, paginação por cursor, CSP sem unsafe-inline, MIME do avatar, signOut seguro
- `9f1c467` — Admin: campos de limite diário e por minuto do Sheep (anti-abuso configuravel)
- `cca2fa4` — Logs mostram e-mail do usuário

### Incidência de 09/08 — login do admin-app
1. **"Email ou senha incorretos"** — senha havia sido definida no projeto **errado** (`iqtqtxlqzveixxxunnvj`). Corrigido resetando no projeto correto `lbgztfqgzjmiwvcghnki`.
2. **"Acesso restrito apenas para administradores"** — `is_admin` aplicado com o **id errado** (`7446cd05...` do projeto antigo). Corrigido aplicando no id correto `417e9bba-583e-454f-bf04-40cfd127f3af`.
- **Lição:** os dois projetos têm ids de usuário diferentes para o mesmo e-mail. Sempre verificar o id no projeto que se está mexendo.
