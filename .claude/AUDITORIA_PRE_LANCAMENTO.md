# Auditoria Pré-Lançamento — 12/08/2026

> Objetivo: registrar o que precisa ser corrigido/testado antes de divulgar o app Leitura da Bíblia.
> Método: análise manual dos dois repos (git diff dos não-commitados + leitura seletiva de segurança).

---

## VEREDITO: ainda NÃO divulgar

A base está sólida (auditorias 10/08), mas há trabalho novo NÃO COMMITADO nos dois repos
("auditoria v4": MFA + trilha de auditoria + hardening do log-push-received) com **1 bug
confirmado** e **3 decisões de segurança em aberto**.

---

## BLOQUEADORES — corrigir antes de compartilhar

| # | Problema | Onde | Tipo |
|---|----------|------|------|
| 1 | **BUG: `getSessionAal()` comparado sem `await`** — `if (getSessionAal() === "aal2")` compara `Promise` com string, sempre `false`. Admin com MFA é forçado a digitar o código em todo reload, mesmo já autenticado. | `admin-app/src/pages/Login.tsx:33` (função `getSessionAal` em `src/lib/mfa.ts:44`) | Bug funcional |
| 2 | **Botão "Limpar tudo" da auditoria falha** — a RLS de `admin_audit_log` (migration 036) só permite SELECT para admin; o `.delete()` no frontend retorna erro. Decidir: remover o botão (recomendado, auditoria deve ser imutável) ou criar policy de DELETE (não recomendado). | `admin-app/src/pages/AuditLog.tsx:52-61` | Bug UX + decisão |
| 3 | **MFA não é obrigatório** — é opt-in (Layout só avisa). O painel dá acesso ao prompt do agente, KB, exclusão de usuários e push. Com MFA desativada, quem tiver a senha entra direto. **Ativar MFA antes de divulgar** (único admin: `luanribeiroterapeuta@gmail.com`). | `admin-app/src/components/Layout.tsx` + `Settings.tsx` | Segurança |
| 4 | **Migrations 035 e 036 NÃO aplicadas** + edge functions modificadas NÃO deployadas — `log-push-received` ainda roda a versão antiga (aceita anon key) em produção. | `supabase/migrations/035_*` e `036_*` | Deploy pendente |

## RISCOS MÉDIOS (verificar/testar)

| # | Risco | Onde | O que fazer |
|---|-------|------|-------------|
| 5 | `jw-media.ts` reescrito — agora parseia `data.files.T.MP4` (antes `data.books[].videos[].MP4`). Formato real da API não validado nesta sessão. | `Leitura-da-Biblia/src/lib/jw-media.ts` | Testar vídeos de introdução em produção (vários livros) |
| 6 | Vulnerabilidades de dependências não auditadas (`npm audit` não rodado). | `package.json` (ambos) | Rodar `npm audit --omit=dev` nos dois apps |
| 7 | `push_received_log` precisa revalidar RLS após migration 035 (anon não pode INSERT; só edge function via service_role). | migration 027 + 035 | Conferir policies no SQL Editor |
| 8 | `agent_config.agent_avatar` (base64 até 500KB) exposto via RLS — payload pesado no `loadAgentConfig` de toda sessão. | `bible-agent.ts` / RLS 005 | Avaliar migrar avatar para Storage Supabase |
| 9 | `001_initial_schema.sql` untracked (regenerado?) — decidir commit ou ignorar. | `Leitura-da-Biblia/supabase/migrations/001_*` | Revisar diff antes de commit |

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

1. Corrigir bug 1 (`await getSessionAal()`), decidir bug 2, ativar MFA (bug 3).
2. Aplicar migrations 035/036 no `lbgztfqgzjmiwvcghnki`.
3. Deploy: `npx supabase functions deploy log-push-received admin-operations --project-ref lbgztfqgzjmiwvcghnki`.
4. `npm run build` nos dois apps.
5. Testar: login admin com/sem MFA, auditoria (alterar prompt/artigo → registrar), push recebido (log com user_id), vídeos JW (vários livros).
6. `npm audit --omit=dev` nos dois apps.
7. Commit + push nos dois repos (auto-deploy Vercel).
8. Teste em produção: PWA install, notificação push real (há 0 inscritos — recrutar 1 testador), 429 do Sheep.

## Pendências conhecidas de TODO.md (não bloqueiam lançamento)

Busca no Dashboard, compartilhar progresso, modo compacto, dark/light, pull-to-refresh, swipe, acessibilidade, timezone UTC-3, multi-ano, i18n, testes automatizados, melhorar UI do agente, mais artigos KB, reescrever prompt Sheep.
