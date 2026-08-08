# Roadmap — Leitura da Bíblia

> Atualizado em 2026-08-08. Backlog e pendências registradas durante a preparação para o lançamento.

---

## Pendências de lançamento (dashboard Supabase / admin)

- [x] **Auth → URL Configuration**: Site URL e Redirect URLs = `https://leitura-da-biblia.vercel.app`
- [x] **Email confirmation**: ligada no cadastro
- [x] **Google provider**: habilitado e funcionando (login com Google ok)
- [x] **Sheep**: `system_prompt` salvo no admin (Prompt do Agente)
- [ ] **Knowledge base**: usuário cadastrando conteúdos aos poucos (Sheep avisa "assunto não encontrado" para temas ainda não adicionados — comportamento esperado)
- [ ] Teste final em dispositivo limpo: cadastro com confirmação de e-mail, login, dia 1 do plano

## Adiado — push/lembrete diário

- [ ] `VITE_VAPID_PUBLIC_KEY` no Vercel (production) — hoje ausente; sem isso `subscribeToPush` não ativa
- [ ] Secrets na edge function `send-daily-reminder`: `VAPID_EMAIL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- [ ] Agendar cron da `send-daily-reminder` (respeita `preferred_hour` por timezone)
- [ ] Código já tem fallback seguro: sem a chave VAPID, push fica desativado (não quebra o app)

---

## Backlog — Gamificação (planejar com calma)

### 1. Decisões pendentes
- **Registro emocional** (escolher): lúdico respeitoso / discreto e espiritual / totalmente lúdico
- Restrições de marca: emoji, mascote, tom do copy (a definir)
- Mecânicas que entram na 1ª entrega vs. depois

### 2. Mecânicas candidatas
- [ ] Celebração ao concluir o dia (animação + mensagem + card compartilhável)
- [ ] Conquistas/medalhas: 1º dia, 7 dias, 30 dias, seções/livros concluídos, notas criadas, perguntas ao Sheep
- [ ] Níveis/Jornada espiritual (ex.: "Primícias", "Fruto", "Maturidade") por total de dias lidos
- [ ] Streak por dias do calendário real (hoje o streak é por dia do plano — `calcStreak` em `src/lib/reading-plan.ts`)
- [ ] Card de conquista para compartilhar (estilo do "Compartilhar progresso" atual)
- [ ] Desafios semanais (ex.: ler 5 dos 7 dias)

### 3. Identidade visual da gamificação
- **Mascote**: criar mascote próprio (não copiar Duolingo). Sheep é o único mascote atual (chat).
- **Medalhas**: desenhar no estilo do app — paleta atual (fundo `#0f0f1a`, card `#1a1a2e`, ação `#3b82f6`, apoio roxo `#5a3b87`, streak laranja `#f97316`), fonte de sistema, `rounded-2xl`.

### 4. Onde aplicar
- Dashboard (widgets de progresso/conquistas)
- Tela de leitura (celebração pós-conclusão)
- Nova tela "Conquistas"
- Perfil

### 5. Dados disponíveis (sem novas tabelas para começar)
- `reading_progress` — dia concluído + `created_at` (streak por calendário real)
- `profiles` — `reading_start_date`, `display_name`, `email`
- `notes` — atividade por dia
- `chat_history` — interações com o Sheep
- (Se necessário depois) tabela `achievements` com RLS

### 6. Referências de padrões (skill Recreio)
- `principios-gamificacao.md` e `template-design-system.md` da skill `recreio` — aplicar função, nunca a forma literal do Duolingo.
