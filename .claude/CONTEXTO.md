# Contexto — App Leitura da Bíblia

## Sobre
App PWA de leitura bíblica em 366 dias, com identidade visual dark moderna, vídeos de introdução inline, checklist de capítulos e anotações pessoais. Baseado no plano "Ler a Bíblia em 366 Dias" das Testemunhas de Jeová.

**Stack:** React + TypeScript + Vite + Supabase (auth + DB) + Vercel (deploy)

**URL:** https://leitura-da-biblia.vercel.app

---

## Identidade Visual

- **Fundo:** `#0f0f1a`
- **Cards:** `#1a1a2e`
- **Hover:** `#252540`
- **Ação (accent):** `#3b82f6` (azul)
- **Texto:** `#f1f1f1`
- **Dourado/amber:** removido completamente. Nada de `#d4a853`, `#f59e0b`, `#amber` etc.
- **Emojis:** proibido. Tudo com ícones `lucide-react`.
- **Cruz:** substituída por `Heart`.
- **Tom da marca:** 50% acolhedor + 50% clareza. Sem hype, sem infantilizar.

---

## Funcionalidades Implementadas

### Dashboard
- Streak de dias seguidos com ícone `Flame` e pulse a cada 7 dias
- Anel de progresso SVG (arc) com % e contagem `X/366`
- Card central com a leitura do dia (título, seção, marcador)
- Botão "Iniciar" navega para `/ler/{dia}` (página interna, não jw.org)
- Botão "Concluir leitura" / "Leitura concluída"
- Seção "Dias anteriores" (colapsável, últimos 3 completados)
- Seção "Próximos dias" (3 não-completados à frente)
- Card de vídeo de introdução do livro (link externo JW.ORG)
- **Não auto-avança** ao completar — o dia atual permanece visível
- Botão "Ir para o próximo dia" avança manualmente
- `currentDay` persistido no localStorage

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

### Sincronização Dashboard ↔ Página do Dia
- Marcar "Concluir leitura" no Dashboard → checkboxes todos marcados (via localStorage)
- Marcar último checkbox no dia → dia concluído no Supabase → Dashboard reflete
- `user_id` incluído em todos os inserts/delete (RLS)
- Estado dos checkboxes salvo em `localStorage key: checked_{dayNum}`

### API de Vídeos
- `src/lib/jw-media.ts`: busca `GETPUBMEDIALINKS` da API pública JW.ORG
- Cache em memória, retorna URL MP4 da melhor qualidade
- Fallback: link externo `jw.org` se a API não responder
- CDN: `akamd1.jw-cdn.org`

### Plano de Leitura
- `src/lib/reading-plan.ts`: 366 dias, array `ReadingDay[]`
- Cada entry: day, book, bookNum, title, chapters, section, marker
- 10 seções: Pentateuco, Históricos, Poéticos, Profetas Maiores, Profetas Menores, Evangelhos, Atos & Paulo, Cartas de Paulo, Cartas Gerais, Apocalipse

### Autenticação
- Google OAuth via Supabase
- ProtectedRoute + Layout wrapper

---

## Decisões de Implementação

1. **Botão "Ler" → "Iniciar":** não abre jw.org direto, navega pra página interna com capítulos + anotações
2. **Sem auto-avanço:** após concluir, o dia continua sendo exibido; avança só com "Ir para o próximo dia"
3. **Checkbox state em localStorage:** `checked_{dayNum}` persiste entre visitas
4. **Conclusão two-way:** Dashboard ↔ Página do Dia sincronizados
5. **Vídeos inline:** `<video>` nativo com controls, sem iframe, sem dependência externa
6. **Fallback de vídeo:** se API falha, mantém link externo pra JW.ORG
7. **Ícone `cross` removido:** substituído por `Heart` (lucide-react)
8. **Cores:** paleta escura com azul como cor de ação, sem dourado/amber
9. **"Dias anteriores":** seção colapsável no Dashboard com últimos 3 completados

---

## Pendências / Ideias Futuras
- (Nenhuma pendência no momento)

---

*Última atualização: 21/07/2026*
