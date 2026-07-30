# Lista de Melhorias — Leitura da Bíblia

> Atualizado: 27/07/2026

---

## PRIORIDADE CRÍTICA (afeta funcionamento)

| # | Problema | Status |
|---|----------|--------|
| 1 | Efeito colateral no render do Dashboard (`setReadingStartDate` e `setCurrentDay` chamados durante render) | ✅ Corrigido |
| 2 | Service Worker desativado no `main.tsx` (impede PWA/offline) | ✅ Corrigido |

---

## PRIORIDADE ALTA (bugs e usabilidade)

| # | Problema | Status |
|---|----------|--------|
| 3 | Função `getChaptersList` duplicada em Dashboard.tsx e ReadingDayPage.tsx | ✅ Corrigido |
| 4 | Cálculo de streak duplicado e inconsistente (Dashboard vs Estatísticas) | ✅ Corrigido |
| 5 | Dias duplicados no plano de leitura causam contagem errada de capítulos | ✅ Corrigido |
| 6 | Porcentagem no YearView do Calendário divide por 366 em vez de dias do mês | ✅ Corrigido |
| 7 | Sem tratamento de erro visível para o usuário quando Supabase falha | ✅ Corrigido |
| 8 | Sem tela de boas-vindas quando o plano não começou (configura automaticamente) | ✅ Corrigido |

---

## PRIORIDADE MÉDIA (qualidade e experiência)

| # | Problema | Status |
|---|----------|--------|
| 9 | Bundle de 552KB sem code splitting (lazy loading por rota) | ✅ Corrigido |
| 10 | Plano de leitura (400+ entradas) carregado sempre em todas as rotas | ✅ Corrigido |
| 11 | `vite-plugin-pwa` instalado mas não usado | ✅ Corrigido |
| 12 | Sem manifesto PWA (app não pode ser instalado no celular) | ✅ Corrigido |
| 13 | Sem tags Open Graph (sem preview ao compartilhar link) | ✅ Corrigido |
| 14 | Botões de dia nas Seções muito pequenos (28x28px, mínimo 44x44px) | ✅ Corrigido |
| 15 | Sem redefinição de senha (esqueceu a senha = perdeu a conta) | ✅ Corrigido |
| 16 | Sem alternância de visibilidade da senha no login | ✅ Corrigido |
| 17 | Heatmap muito pequeno no celular | ✅ Corrigido |
| 18 | Sem feedback quando notificações são bloqueadas pelo navegador | ✅ Corrigido |
| 19 | Erro de plural: "1 mes" em vez de "1 mês" | ✅ Corrigido |
| 20 | `.env.example` incompleto (falta `VITE_VAPID_PUBLIC_KEY`) | ✅ Corrigido |

---

## PRIORIDADE BAIXA (melhorias futuras)

| # | Problema | Status |
|---|----------|--------|
| 21 | Sem animação de conclusão (confetti/pulse ao marcar dia como lido) | ✅ Corrigido |
| 22 | Sem busca no Dashboard para livros/capítulos | ❌ |
| 23 | Sem compartilhar progresso (gerar imagem para redes sociais) | ❌ |
| 24 | Sem modo compacto (mostrar mais info sem scroll) | ❌ |
| 25 | Sem dark/light mode | ❌ |
| 26 | Sem suporte offline | ✅ Corrigido |
| 27 | Sem pull-to-refresh no celular | ❌ |
| 28 | Sem navegação por gesto (swipe para dia anterior/próximo) | ❌ |
| 29 | Sem acessibilidade (ARIA labels, navegação por teclado) | ❌ |
| 30 | Tipos não utilizados no `types.ts` (`DayProgress`, `UserNote`) | ✅ Corrigido |
| 31 | `console.error` em produção (Stats.tsx) | ✅ Corrigido |
| 32 | tsconfig com verificações desligadas (`noUnusedLocals: false`) | ✅ Corrigido |
| 33 | Sem `robots.txt` | ✅ Corrigido |
| 34 | Sem dados estruturados (JSON-LD) | ✅ Corrigido |
| 35 | Título genérico no HTML ("Leitura da Biblia") | ✅ Corrigido |
| 36 | Timezone hardcoded UTC-3 na Edge Function | ❌ |
| 37 | Sem limite de tamanho na anotação (texto infinito) | ✅ Corrigido |
| 38 | Sem suporte a vários anos (plano para 366 dias sem recomeçar) | ❌ |
| 39 | Sem internacionalização (tudo em português) | ❌ |

---

## FEATURES IMPLEMENTADAS (além das correções)

| # | Feature | Status |
|---|---------|--------|
| F1 | Onboarding multi-step (nome, idade, batismo, instruções) | ✅ |
| F2 | Perfil do usuário (`/perfil`) com foto, dados inline-editáveis | ✅ |
| F3 | Foto de perfil comprimida (200x200 JPEG) no header e perfil | ✅ |
| F4 | Aniversário de batismo (banner + notificação) | ✅ |
| F5 | Lembrete inteligente (dia + streak + mensagem na push) | ✅ |
| F6 | Edge Function `send-daily-reminder` com cálculo de dia/streak | ✅ |
| F7 | Migration `reading_start_date` no profiles | ✅ |
| F8 | Compartilhar conteúdo (Web Share API + clipboard fallback) | ✅ |
| F9 | Offline mode (service worker para wol.jw.org + app shell) | ✅ |
| F10 | Confetti na conclusão do dia | ✅ |
| F11 | Navegação Anterior/Próximo no Dashboard | ✅ |
| F12 | Bible SVG favicon customizado | ✅ |
| F13 | Bible SVG icon no header ao lado do título | ✅ |
| F14 | AI Bible Agent "Sheep" — Groq (Llama 3.3 70B), rotação de keys | ✅ |
| F15 | Chat history persistente — mensagens salvas no Supabase | ✅ |
| F16 | Sidebar de conversas estilo ChatGPT (criar, renomear, excluir) | ✅ |
| F17 | Soft delete e arquivamento de conversas | ✅ |
| F18 | Base de conhecimento (tabela `knowledge_base`) com keyword matching | ✅ |
| F19 | Prompt editável do agente (tabela `agent_config`) | ✅ |
| F20 | Admin app — gerenciamento do agente via interface web | ✅ |
| F21 | Foto, nome, descrição e sugestões do agente editáveis no admin | ✅ |
| F22 | Descrição do agente exibida centralizada no chat | ✅ |
| F23 | Foto do usuário exibida ao lado das mensagens | ✅ |
| F24 | Busca WOL desativada (latência excessiva) | ✅ |

---

## PRÓXIMOS PASSOS

| # | Feature | Status |
|---|---------|--------|
| P1 | Melhorar UI/UX do agente (design da sidebar, responsividade) | ❌ |
| P2 | Adicionar novos artigos à base de conhecimento (artigos WOL) | ❌ |
| P3 | Reescrever prompt do Sheep (evitar fanatismo, ser mais direto) | ❌ |
| P4 | Testes automatizados | ❌ |
| P5 | PWA completo (service worker otimizado, offline) | ❌ |
