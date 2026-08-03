# Contexto — App Leitura da Bíblia

## Sobre
App de leitura bíblica em 366 dias, com identidade visual dark moderna, vídeos de introdução inline, checklist de capítulos, anotações pessoais e agente IA "Sheep". Inclui app administrativo para gerenciar o agente. Baseado no plano "Ler a Bíblia em 366 Dias" das Testemunhas de Jeová.

**Stack:** React + TypeScript + Vite + Supabase (auth + DB) + Vercel (deploy)

**URL App:** https://leitura-da-biblia.vercel.app
**URL Admin:** https://admin-app-two-orcin.vercel.app

**Deploy:** Manual via `npx vercel --prod --yes`

**GitHub:** https://github.com/souluanribeiro/leitura-da-biblia

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
- **Favicon:** SVG customizado (livro azul com páginas brancas em fundo arredondado)
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
- **URL:** https://admin-app-two-orcin.vercel.app
- **Páginas:** Login, Dashboard, Knowledge Base, Prompt Editor, Logs, Settings
- **Settings:** Foto do agente (base64), nome, descrição, sugestões
- **Knowledge Base:** CRUD de artigos com título, conteúdo, keywords — **única fonte de conhecimento do Sheep**
- **Prompt Editor:** Edição do system prompt do agente (com dica de placeholders)
- **Logs:** Visualização do histórico de conversas
- **Acesso:** restrito a usuários com `profiles.is_admin = true`

### Autenticação
- Google OAuth + email/senha via Supabase
- ProtectedRoute + Layout wrapper
- Toggle de visibilidade da senha
- Link "Esqueceu a senha?" → modo redefinição com email

### API de Vídeos
- `src/lib/jw-media.ts`: busca `GETPUBMEDIALINKS` da API pública JW.ORG
- Cache em memória, retorna URL MP4 da melhor qualidade

### Notificações Push
- `src/lib/push.ts` + Supabase edge function `send-daily-reminder`
- VAPID keys no `.env`
- GitHub Actions workflow para envio diário

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
- **Tabelas:** `reading_progress`, `notes`, `push_subscriptions`, `profiles` (com `reading_start_date`, `is_admin`), `chat_history` (com `conversation_id`), `conversations`, `knowledge_base`, `agent_config`
- **Edge Functions:** `bible-agent` (`verify_jwt=true`), `send-daily-reminder` (`verify_jwt=false`, cron), `admin-operations` (`verify_jwt=false` com auth+admin check manual), `send-admin-notification` (`verify_jwt=false` com auth+admin check manual)
- **Auth trigger:** cria perfil automaticamente no signup

### Migrations
- `002_add_reading_start_date.sql`
- `003_add_chat_history.sql`
- `004_knowledge_base.sql` — tabela knowledge_base + RLS admin
- `005_agent_config.sql` — tabela agent_config + is_admin no profiles
- `006_conversations.sql` — tabela conversations + conversation_id no chat_history
- `018_knowledge_base_fts.sql` — search_vector + RPC FTS (v1, plainto_tsquery)
- `023_knowledge_base_fts_v2_and_trigger.sql` — FTS v2 (OR de termos) + trigger de search_vector

---

## API Keys e Segredos

- **Groq API Key:** armazenada como secret `GROQ_API_KEYS`
- **Modelo:** `llama-3.3-70b-versatile` (Groq)
- **Limite:** 30 RPM por key (Groq free tier)
- **Rotação:** automática entre múltiplas keys separadas por vírgula
- **Rate limit handling:** retry automático com próxima key em caso de 429

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
10. **Favicon:** SVG customizado
11. **Foto de perfil:** comprimida 200x200 JPEG, localStorage
12. **Onboarding:** multi-step com persistência
13. **Bíblia copyright:** links externos para wol.jw.org
14. **Baptism anniversary:** banner + notificação
15. **Agente IA:** Groq (não Gemini) com rotação de keys para evitar rate limit
16. **Controle total do agente:** prompt 100% do admin (sem prompt padrão no código) e fontes 100% do admin (knowledge_base, sem WOL). Ver `RELATORIO_SESSAO_2026-08-03.md`
17. **Busca na base:** FTS v2 com OR de termos (tolerante a linguagem natural); trigger mantém `search_vector` atualizado ao editar artigos no admin

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
- `supabase/functions/send-admin-notification/index.ts` — Edge Function push notifications para admin
- `supabase/migrations/004_knowledge_base.sql`
- `supabase/migrations/005_agent_config.sql`
- `supabase/migrations/006_conversations.sql`
- `supabase/migrations/023_knowledge_base_fts_v2_and_trigger.sql`

### Admin App
- `src/pages/Settings.tsx` — Foto, nome, descrição, sugestões do agente
- `src/pages/KnowledgeBase.tsx` — CRUD de artigos
- `src/pages/PromptEditor.tsx` — Editor do system prompt
- `src/pages/Logs.tsx` — Histórico de conversas
- `src/pages/Dashboard.tsx` — Stats do admin
- `src/pages/Login.tsx` — Login com Google + email/senha
- `src/components/Layout.tsx` — Sidebar de navegação
- `src/lib/supabase.ts` — Cliente Supabase hardcoded (lbgztfqgzjmiwvcghnki)

---

*Última atualização: 03/08/2026*
