# Contexto — App Leitura da Bíblia

## Sobre
App de leitura bíblica em 366 dias, com identidade visual dark moderna, vídeos de introdução inline, checklist de capítulos e anotações pessoais. Baseado no plano "Ler a Bíblia em 366 Dias" das Testemunhas de Jeová.

**Stack:** React + TypeScript + Vite + Supabase (auth + DB) + Vercel (deploy)

**URL:** https://leitura-da-biblia.vercel.app

**Deploy:** Manual via `npx vercel --prod --yes`

---

## Identidade Visual

- **Fundo:** `#0f0f1a`
- **Cards:** `#1a1a2e`
- **Hover:** `#252540`
- **Ação (accent):** `#3b82f6` (azul)
- **Texto:** `#f0f0f5`
- **Muted:** `#8888aa`
- **Secundário (roxo):** `#5a3b87` / `purple-600`
- **Emojis:** proibido (exceto marcadores 🔸🔹). Tudo com ícones `lucide-react`.
- **Tom da marca:** 50% acolhedor + 50% clareza. Sem hype, sem infantilizar.
- **Sem PWA/service worker** — removido por problemas de cache persistente

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
- Anel de progresso SVG (arc) com % e contagem `X/366`
- Card central com a leitura do dia (título, seção, marcador)
- Botão "Iniciar" navega para `/ler/{dia}`
- Botão "Concluir leitura" / "Leitura concluída"
- Seção "Dias anteriores" (colapsável, últimos 3 completados)
- Seção "Próximos dias" (3 não-completados à frente)
- Card de vídeo de introdução do livro (link externo JW.ORG)
- **Não auto-avança** ao completar — o dia permanece visível
- Botão "Ir para o próximo dia" avança manualmente
- Marcadores: `text-orange-400` para 🔸, `text-blue-400` para 🔹, `text-text-muted` para sem marcador

### Página do Dia (`/ler/{dia}`)
- Lista de leituras do dia com título, seção, marcador
- **Player de vídeo inline** (`<video controls>`) com introdução do livro via CDN JW.ORG
- **Checklist de capítulos** com checkbox + botão "Ler" ao lado (abre wol.jw.org)
- **Barra de progresso** `X/total capítulos`
- Badge "Todos os capítulos lidos" quando completo
- Botão "Marcar lido" / "Concluído" no topo
- **Auto-completar:** marcar o último checkbox → dia concluído no Supabase
- **Auto-desmarcar:** desmarcar checkbox → remove conclusão do dia
- **Área de anotações** salvas no Supabase (tabela `notes`)

### Páginas
- `/` — Dashboard (Hoje)
- `/ler/{dia}` — Página de leitura do dia
- `/calendario` — Calendário (4 visões: mês, semana, agenda, ano)
- `/secoes` — Seções da Bíblia
- `/notas` — Página de anotações com busca e filtros
- `/instrucoes` — Instruções com links para Seções e marcadores

### Seções (`/secoes`)
- Seções de marcador aparecem no topo com numeração independente (1, 2, 3...)
- Seções de livros abaixo, com botão **+N** expansível (azul, bold)
- Botão **recolher** (roxo, bold) para recolher
- Ícone de check verde quando seção 100% concluída

### Instruções (`/instrucoes`)
- Link para "Ver todas as seções" → `/secoes`
- 🔸 para textos sobre os Tratos de Deus com os Israelitas
- 🔹 para textos sobre o Desenvolvimento da Congregação Cristã

### Notas (`/notas`)
- Lista todas as anotações do usuário ordenadas por dia (mais recentes primeiro)
- Busca por texto livre (conteúdo, título, livro)
- Filtros: seção (prioriza títulos das seções incluindo 🔸🔹), livro
- Botão "Limpar filtros" quando há filtros ativos
- Cards com: cor da seção, dia, título, nome da seção, preview da nota (3 linhas)
- Clique no card navega para `/ler/{dia}`
- Contador total de notas no topo
- Estado vazio: mensagem orientativa
- Loading: skeleton animado
- **Auto-save** nas anotações (debounce 1.5s) com feedback visual: "Salvando...", "✓ Salvo" (sempre visível), "Erro ao salvar"

### Autenticação
- Google OAuth + email/senha via Supabase
- ProtectedRoute + Layout wrapper

### API de Vídeos
- `src/lib/jw-media.ts`: busca `GETPUBMEDIALINKS` da API pública JW.ORG
- Cache em memória, retorna URL MP4 da melhor qualidade
- Fallback: link externo `jw.org` se a API não responder

### Notificações Push
- `src/lib/push.ts` + Supabase edge function `send-daily-reminder`
- VAPID keys no `.env` (`VITE_VAPID_PUBLIC_KEY`)
- GitHub Actions workflow para envio diário

---

## Navegação (Bottom Nav — 5 abas, Hoje no centro)
- 📅 Calendário (`/calendario`) — ícone CalendarDays
- 📚 Seções (`/secoes`) — ícone LayoutGrid
- 🏠 Hoje (`/`) — ícone Home (centro, destaque)
- 📝 Notas (`/notas`) — ícone StickyNote
- 📖 Instruções (`/instrucoes`) — ícone GraduationCap

---

## Supabase

- **Projeto:** `lbgztfqgzjmiwvcghnki`
- **Tabelas:** `reading_progress`, `notes`, `push_subscriptions`, `profiles`
- **Auth trigger:** cria perfil automaticamente no signup

---

## Decisões de Implementação

1. **Sem PWA/service worker:** removido por problemas de cache que impediam atualizações de aparecerem no browser
2. **Current day:** mostra primeiro dia **não-completado** via `getNextUncompletedDay(completedDays)`, não baseado em calendário
3. **Checkbox state em localStorage:** `checked_{dayNum}` persiste entre visitas
4. **Conclusão two-way:** Dashboard ↔ Página do Dia sincronizados
5. **Vídeos inline:** `<video>` nativo com controls, sem iframe
6. **Seções de marcador independentes:** filtram por marker, numeração própria (1, 2, 3...), para que usuário possa começar por elas
7. **+N expansível:** botão azul bold que mostra todos os dias ocultos; recolher roxo bold

---

## Arquivos Principais

- `src/pages/Dashboard.tsx` — Dashboard com streak, progresso, marcadores
- `src/pages/ReadingDayPage.tsx` — Checklist, vídeo, anotações auto-save, marcadores
- `src/pages/Sections.tsx` — Seções de marcador + seções de livros com +N
- `src/pages/Notes.tsx` — Página de anotações com busca e filtros
- `src/pages/Instructions.tsx` — Instruções com 🔸/🔹
- `src/pages/Calendar.tsx` — Calendário 4 visões
- `src/pages/Login.tsx` — Google OAuth + email/senha
- `src/components/Layout.tsx` — Bottom nav (5 tabs, Hoje no centro)
- `src/lib/reading-plan.ts` — Plano 366 dias, 12 seções, marcadores
- `src/lib/jw-media.ts` — API de vídeos JW.ORG
- `src/lib/push.ts` — Notificações push
- `src/types.ts` — Tipos (ReadingDay, Section, marker)
- `vite.config.ts` — Config Vite (sem plugin PWA)
- `src/main.tsx` — Entry point (com auto-unregister de SW antigo)

---

*Última atualização: 22/07/2026*
