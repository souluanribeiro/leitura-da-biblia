# Relatório de Sessão — 12/08/2026

## Estado: NÃO divulgar ainda — há trabalho não commitado em andamento

**Auditoria de 10/08 concluiu "SIM, pronto para divulgar"** (commit `6e5e375`), mas desde então entrou trabalho novo não commitado nos dois repos. Não divulgue até concluir e testar os itens abaixo.

---

## Em andamento (NÃO COMMITADO) — "auditoria v4"

### Leitura-da-Biblia (`main` — 7 arquivos modificados + 2 migrations novas)
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/log-push-received/index.ts` | reescrito para exigir JWT (não aceita mais anon key) |
| `supabase/functions/admin-operations/index.ts` | +33 linhas (grava em `admin_audit_log`) |
| `public/sw.js` | +27 linhas (service worker) |
| `src/lib/jw-media.ts` | +62 linhas (API de vídeos JW) |
| `src/pages/ReadingDayPage.tsx` | +16 linhas |
| `vite.config.ts` | +11 linhas |
| `supabase/migrations/035_log_push_received_auth.sql` | `user_id` em `push_received_log` (JWT obrigatório) |
| `supabase/migrations/036_admin_audit_log.sql` | tabela `admin_audit_log` + triggers de auditoria |

### admin-app (`main` — 4 arquivos modificados + 2 novos)
| Arquivo | Mudança |
|---------|---------|
| `src/lib/mfa.ts` | NOVO — MFA TOTP (enroll/verify/unenroll) |
| `src/pages/Settings.tsx` | +149 linhas — UI de MFA |
| `src/pages/Login.tsx` | +152 linhas — login exige código MFA |
| `src/pages/AuditLog.tsx` | NOVO — página de trilha de auditoria |
| `src/App.tsx` / `src/components/Layout.tsx` | rota + menu "Auditoria" |

---

## O QUE FALTA FAZER (próxima sessão)

### Bloqueadores
1. **Aplicar migrations 035 e 036** no Supabase `lbgztfqgzjmiwvcghnki` (SQL Editor ou `supabase db push`).
2. **Deploy das edge functions modificadas** (verify_jwt conforme config.toml):
   `npx supabase functions deploy log-push-received admin-operations --project-ref lbgztfqgzjmiwvcghnki`
3. **`npm run build`** nos dois apps (tsc + vite) — confirmar que MFA e AuditLog compilam.
4. **Testar MFA no admin-app:** configurar TOTP, login com código, e conferir se quem não tem MFA ainda consegue logar (decidir se MFA deve ser obrigatório).
5. **Testar auditoria:** alterar prompt/artigo no admin e ver o registro em `AuditLog.tsx`.
6. **Commit + push** nos dois repos (auto-deploy dispara).
7. **Limpar:** `dev-server.log` (untracked) — decidir se entra no `.gitignore`.

### Auditoria de segurança — INCOMPLETA
As tasks de auditoria foram canceladas nesta sessão por limite de tokens. Revisar pendente:
- `supabase/functions/bible-agent/index.ts` e demais edge functions (vazamento de secrets, CORS, auth)
- CSP/headers (`vercel.json`, `vite.config.ts`)
- Dependências com vulnerabilidades (`package.json` de ambos)
- `tsconfig` (strict, noUnusedLocals)

### Pendências conhecidas de `TODO.md` (abertas)
- Busca no Dashboard, compartilhar progresso, modo compacto, dark/light mode, pull-to-refresh, swipe, acessibilidade, timezone UTC-3 na edge function, suporte multi-ano, internacionalização, PWA completo, testes automatizados, melhorar UI/UX do agente, novos artigos na base, reescrever prompt do Sheep.

---

## Links úteis
- Edge functions deploy: `npx supabase functions deploy <nome> --project-ref lbgztfqgzjmiwvcghnki`
- Migrations: `Leitura-da-Biblia/supabase/migrations/`
- Padrão visual e credenciais: `.claude/CLAUDE.md`

*Sessão encerrada cedo por limite de tokens (tasks de auditoria canceladas).*
