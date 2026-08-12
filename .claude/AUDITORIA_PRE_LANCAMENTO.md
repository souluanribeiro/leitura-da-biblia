# Auditoria Pré-Lançamento — 12/08/2026

> Objetivo: registrar o que precisa ser corrigido/testado antes de divulgar o app Leitura da Bíblia.
> Método: análise manual dos dois repos (git diff dos não-commitados + leitura seletiva de segurança).

---

## VEREDITO (atualizado 12/08 à noite): ainda NÃO divulgar

Itens 1-9 desta auditoria foram resolvidos e publicados (commits `fd46782` no
Leitura-da-Biblia e `58ddd6a` no admin-app, ambos em produção). **Mas a correção do
item 3 (MFA) introduziu uma falha de segurança nova e mais séria, ainda não corrigida.**
Ver seção "BLOQUEADOR NOVO — MFA só client-side" abaixo. **Não divulgar até isso ser
corrigido no servidor**, não só na tela.

---

## BLOQUEADOR NOVO (12/08, pós-deploy) — MFA enforcement é só de fachada

Uma revisão de segurança automática nos commits publicados encontrou 3 falhas reais no
que foi implementado para o item 3 (ver commit `58ddd6a`). Confirmado por leitura manual
do código — não é falso positivo.

**Causa raiz:** o bloqueio de MFA criado em `Layout.tsx` só existe na tela (React). Nenhuma
policy RLS nem edge function do projeto `lbgztfqgzjmiwvcghnki` checa `auth.jwt()->>'aal'`
(confirmado via grep — só aparece em arquivos do admin-app, nenhum no backend). Isso
significa que qualquer chamada direta à API (console do navegador, curl com o token,
etc.) ignora completamente a trava da tela.

| # | Problema | Onde | Tipo |
|---|----------|------|------|
| 10 | **Bypass de autenticação** — o "MFA obrigatório" trava só a navegação React; qualquer chamada direta ao Supabase/edge functions com o JWT (aal1, só senha) passa batido. | `admin-app/src/components/Layout.tsx` (arquitetura toda) | Segurança — crítico |
| 11 | **Fail-open** — em `Layout.tsx`, `listMfaFactors().catch(() => {})` deixa `mfaMissing` no valor padrão (`false`) se a checagem falhar (erro de rede, etc.), **liberando** o acesso em vez de bloquear. | `admin-app/src/components/Layout.tsx:26-36` | Segurança |
| 12 | **Escalonamento de privilégio via MFA** — `unenrollFactor`/`enrollTotp` (`mfa.ts`) não exigem sessão aal2 antes de desativar ou cadastrar um fator novo. Quem só tem a senha (aal1) pode desativar o MFA do admin de verdade, ou cadastrar o próprio autenticador como segundo fator e virar aal2 sozinho — tudo via chamada direta à API do Supabase (GoTrue), sem passar pela tela. | `admin-app/src/pages/Settings.tsx` (`handleDisableMfa`, `handleConfirmEnroll`) + `admin-app/src/lib/mfa.ts` | Segurança — crítico |

**Limitação de plataforma identificada:** o endpoint de gerenciamento de MFA do Supabase
(GoTrue `auth.mfa.*`) não passa pelas RLS policies do Postgres — não dá pra travar
`enroll`/`unenroll` só com policy. A mitigação real depende de duas frentes:
1. **Enforcement server-side de aal2** em RLS + edge functions para toda ação sensível
   (excluir usuário, editar prompt, ver knowledge_base/auditoria) — isso pelo menos garante
   que uma sessão aal1 (só senha) não consegue fazer nada destrutivo sozinha.
2. Mesmo assim, um atacante com a senha ainda consegue **se auto-elevar** a aal2
   cadastrando o próprio autenticador (comportamento padrão do GoTrue). Não há como o
   código da aplicação impedir isso 100% — a defesa real contra "atacante tem a senha"
   é a força/unicidade da senha em si, não o MFA. Considerar: log de auditoria específico
   para eventos de enroll/unenroll de MFA (`admin_audit_log`, já existe a tabela — só
   falta o trigger), pra pelo menos detectar se isso acontecer.

**Não implementado ainda** — ficou para a próxima sessão. Próximos passos sugeridos:
1. Adicionar checagem de `aal2` nas RLS policies das tabelas sensíveis e nos edge functions
   `admin-operations`/`send-admin-notification` (checar claim `aal` do JWT, não só `is_admin`).
2. Corrigir o fail-open do item 11 (fail-closed: enquanto não confirmar aal2, tratar como
   bloqueado, inclusive em erro).
3. Adicionar trigger de auditoria em enroll/unenroll de MFA (detective control, já que
   preventive control total não é possível pela limitação do GoTrue).
4. Confirmar com o usuário (`luanribeiroterapeuta@gmail.com`) que o MFA dele está
   realmente ativo, e trocar a senha do admin-app por uma forte e única (mitigação mais
   eficaz contra o cenário "atacante tem a senha").

---

## BLOQUEADORES ORIGINAIS — todos corrigidos e publicados (ver commits `fd46782`/`58ddd6a`)

| # | Problema | Onde | Tipo | Status |
|---|----------|------|------|--------|
| 1 | **BUG: `getSessionAal()` comparado sem `await`** — `if (getSessionAal() === "aal2")` compara `Promise` com string, sempre `false`. Admin com MFA é forçado a digitar o código em todo reload, mesmo já autenticado. | `admin-app/src/pages/Login.tsx:33` (função `getSessionAal` em `src/lib/mfa.ts:44`) | Bug funcional | ✅ Corrigido (`await`) |
| 2 | **Botão "Limpar tudo" da auditoria falha** — a RLS de `admin_audit_log` (migration 036) só permite SELECT para admin; o `.delete()` no frontend retorna erro. | `admin-app/src/pages/AuditLog.tsx:52-61` | Bug UX + decisão | ✅ Botão removido |
| 3 | **MFA não é obrigatório** — é opt-in (Layout só avisa). | `admin-app/src/components/Layout.tsx` + `Settings.tsx` | Segurança | ⚠️ "Corrigido" na tela, mas ver BLOQUEADOR NOVO acima — a correção não é suficiente |
| 4 | **Migrations 035 e 036 NÃO aplicadas** + edge functions modificadas NÃO deployadas. | `supabase/migrations/035_*` e `036_*` | Deploy pendente | ✅ Aplicado (001/035/036) + deploy de `log-push-received`/`admin-operations` |

## RISCOS MÉDIOS (verificar/testar) — todos resolvidos nesta sessão

| # | Risco | Onde | Status |
|---|-------|------|--------|
| 5 | `jw-media.ts` reescrito — agora parseia `data.files.T.MP4`. Formato real da API não validado. | `Leitura-da-Biblia/src/lib/jw-media.ts` | ✅ Testado contra a API real: 66/66 livros mapeados, vídeo de amostra confirmado (HTTP 200). Poster vem vazio da própria API para vídeos de livro (não é bug — código já trata com `poster undefined`). |
| 6 | Vulnerabilidades de dependências não auditadas. | `package.json` (ambos) | ✅ `npm audit fix` rodado nos dois. Leitura-da-Biblia: 0 vulnerabilidades. admin-app: sobrou 1 moderada em `react-router` (open redirect) que só corrige com upgrade major v6→v7 (breaking change) — deixado como risco residual baixo (painel de admin único usuário) em vez de arriscar quebrar antes do lançamento. |
| 7 | `push_received_log` precisa revalidar RLS após migration 035. | migration 027 + 035 | ✅ Confirmado via query direta no banco: só existem policies de SELECT e DELETE para admin; nenhuma de INSERT para anon/authenticated — só service_role (edge function) grava. |
| 8 | `agent_config.agent_avatar` (base64 até 500KB) exposto via RLS — payload pesado. | `bible-agent.ts` / RLS 005 | ⏸️ Decisão: não é falha de segurança (avatar é público de qualquer forma), só performance. Adiado para depois do lançamento — não é bloqueador. |
| 9 | `001_initial_schema.sql` untracked (regenerado?) — decidir commit ou ignorar. | `Leitura-da-Biblia/supabase/migrations/001_*` | ✅ Revisado (100% idempotente, `IF NOT EXISTS`/`DROP POLICY IF EXISTS`), aplicado em produção e commitado. |

## CONFIRMADO OK (sem ação)

- **CSP/headers:** `vercel.json` dos dois apps sólido (CSP sem `unsafe-inline` em script, DENY em X-Frame-Options, HSTS, nosniff, Referrer-Policy, Permissions-Policy).
- **`verify_jwt` do config.toml:** correto (bible-agent true; cron/functions com validação manual: admin-operations, log-push-received agora validam JWT com `auth.getUser`).
- **log-push-received:** migração de anon key → JWT do usuário (melhoria de segurança, implementada certo no SW + função).
- **Migrations 035/036:** SQL bem construído (audit trigger SECURITY DEFINER com `search_path=''`, RPC `audit_admin_action` valida is_admin, REVOKE de PUBLIC).
- **admin-operations:** grava `admin_audit_log` nas ações destrutivas (delete_conversation/message/user LGPD).
- **tsconfig:** `strict` + `noUnusedLocals` + `noUnusedParameters` ligados nos dois apps.
- **Cliente Supabase:** apenas anon key via `import.meta.env` nos dois apps (sem secrets no client).
- **bible-agent:** auth JWT obrigatória, CORS restrito, não lê body de erro do Groq, RPC atômica `log_user_message` (rate limit).

## VERIFICAÇÃO PÓS-CORREÇÃO (checklist de lançamento)

1. ✅ Bug 1 corrigido (`await getSessionAal()`), bug 2 resolvido (botão removido), bug 3 "corrigido" na tela (mas ver BLOQUEADOR NOVO — insuficiente).
2. ✅ Migrations 001/035/036 aplicadas no `lbgztfqgzjmiwvcghnki`.
3. ✅ Deploy feito: `log-push-received` e `admin-operations`.
4. ✅ `npm run build` OK nos dois apps (+ smoke test via `vite preview`, HTTP 200 nos dois).
5. ⏸️ Testar: vídeos JW ✅ (validado contra API real). **Login admin com/sem MFA:** ainda não testado ao vivo (precisa do celular com o autenticador — só o usuário consegue). Auditoria (alterar prompt/artigo → registrar): não testado ao vivo. Push recebido (log com user_id): não testado ao vivo (precisa de inscrito real).
6. ✅ `npm audit --omit=dev` rodado nos dois apps (ver item 6 acima — 1 risco residual baixo documentado no admin-app).
7. ✅ Commit + push feitos nos dois repos (`fd46782` e `58ddd6a`) — Vercel deve ter feito auto-deploy.
8. ⏸️ Teste em produção pendente: PWA install, notificação push real (0 inscritos — recrutar 1 testador), 429 do Sheep.

### PRÓXIMA SESSÃO — começar por aqui
1. **Prioridade 1:** resolver o BLOQUEADOR NOVO (itens 10-12) — enforcement de MFA no
   servidor, não só na tela. Ver seção acima para o plano sugerido.
2. Testar login com MFA de verdade (usuário precisa estar com o celular em mãos).
3. Recrutar 1 testador para validar push notification real.
4. Só depois disso tudo: liberar divulgação.

## Pendências conhecidas de TODO.md (não bloqueiam lançamento)

Busca no Dashboard, compartilhar progresso, modo compacto, dark/light, pull-to-refresh, swipe, acessibilidade, timezone UTC-3, multi-ano, i18n, testes automatizados, melhorar UI do agente, mais artigos KB, reescrever prompt Sheep.
