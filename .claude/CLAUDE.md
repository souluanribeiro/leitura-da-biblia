# Leitura da Bíblia — Regras

- Quando o usuário disser **"atualize o contexto"**, você deve ler o estado atual do projeto (código, arquivos, etc.) e reescrever `.claude/CONTEXTO.md` com as informações atualizadas — funcionalidades, decisões, pendências e estado atual.
- Sempre comunicar em **português brasileiro (pt-BR)**.
- Usuário é o **desenvolvedor** e deve ser tratado como **amigo, parceiro** — linguagem simples e direta.
- Nunca usar **crucifixo/cruz** em designs. Usar **bíblia, livro aberto, pomba, ramos de oliveira**.
- **Proibido emojis** (exceto 🔸🔹). Usar apenas `lucide-react`.
- **Identity Visual:** Fundo `#0f0f1a`, Cards `#1a1a2e`, Accent `#3b82f6`, Text `#f0f0f5`, Muted `#8888aa`, Purple `#5a3b87`.
- **Deploy:** manual via `npx vercel --prod --yes` (sem GitHub Actions para deploy automático).
- **API Keys:** nunca commitar. Usar `import.meta.env.VITE_*` no frontend.
- **Supabase anon key:** `$VITE_SUPABASE_ANON_KEY` (via env var)
- **Supabase URL:** `$VITE_SUPABASE_URL` (via env var)
- **Supabase project ref:** `lbgztfqgzjmiwvcghnki`
- **App:** https://leitura-da-biblia.vercel.app (projeto Vercel: `leitura-da-biblia`)
- **Admin App:** https://admin-app-two-orcin.vercel.app (projeto Vercel: `admin-app`)
- **Pasta do projeto:** `Biblia-Em-1-Ano/`
- **Edge Functions deploy:** `npx supabase functions deploy <nome> --project-ref lbgztfqgzjmiwvcghnki` (4 functions: `bible-agent`, `send-daily-reminder`, `admin-operations`, `send-admin-notification`; todas declaradas em `supabase/config.toml`)
- **Bíblia copyright:** NUNCA usar API JW.ORG em código final. Usar links externos `wol.jw.org`.
- **Admin user:** `luanribeiroterapeuta@gmail.com` — id **`417e9bba-583e-454f-bf04-40cfd127f3af`** (projeto `lbgztfqgzjmiwvcghnki`). Promover: `UPDATE profiles SET is_admin = true WHERE id = '417e9bba-583e-454f-bf04-40cfd127f3af';`. NÃO usar o id `7446cd05-...` (pertence ao projeto antigo `iqtqtxlqzveixxxunnvj`).
- **Reset de senha admin:** `UPDATE auth.users SET encrypted_password = crypt('SENHA', gen_salt('bf', 10)), updated_at = now() WHERE id = '417e9bba-583e-454f-bf04-40cfd127f3af';` (SQL Editor do `lbgztfqgzjmiwvcghnki`)

## Agent IA
- **Modelo:** Groq `llama-3.3-70b-versatile` (OpenAI-compatible)
- **Edge Function:** `supabase/functions/bible-agent/index.ts`
- **API Key:** secret `GROQ_API_KEYS` (10 keys; **limite é por organização GROQ, 8.000 TPM/min compartilhado** — rotação de key não multiplica)
- **Controle total (desde 03/08/2026):** prompt 100% do admin-app (`agent_config.system_prompt`, **sem prompt padrão no código**) e fontes 100% do admin-app (`knowledge_base`, **sem WOL/scraping**). Ver `.claude/RELATORIO_SESSAO_2026-08-03.md`.
- **Config:** tabela `agent_config` (prompt, nome, avatar, descrição, sugestões)
- **verify_jwt:** `true` (config.toml) + validação manual com `auth.getUser` dentro da função
- **Cron push:** `send-daily-reminder-hourly` (`0 * * * *`) com `CRON_SECRET` no Vault (migrations 029/030)
