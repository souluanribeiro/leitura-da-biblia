# Relatório de Sessão — 03/08/2026

> Resumo de tudo que foi analisido, corrigido e publicado nesta sessão. Tema central: dar ao administrador **controle total** sobre o comportamento (prompt) e o conhecimento (fontes) do agente Sheep, sem intermediários nem comportamento escondido no código.

---

## 1. Contexto inicial

O usuário relatou frustração: o prompt que ele editava no admin-app parecia não ter efeito no comportamento do Sheep, e os erros do agente continuavam. Ao investigar, descobriu-se que **o admin-app tinha (e tem) um editor de prompt funcional** (`admin-app/src/pages/PromptEditor.tsx`) que salva em `agent_config.system_prompt` — e a edge function **já lia esse valor com prioridade** sobre o prompt padrão do código. O que faltava era (a) remover o prompt padrão escondido no código e (b) deixar explícito que o admin é a fonte única de verdade.

O pedido final do usuário:
1. Tudo o que ele editar no admin-app deve ser aplicado automaticamente em todos os lugares.
2. O Sheep deve responder **única e exclusivamente** seguindo o prompt criado no admin-app.
3. As fontes do Sheep devem ser **apenas** as carregadas no admin-app.

---

## 2. Incidente: corrupção de `agent_config` (registro transparente)

Durante a sessão, uma tentativa de atualizar a tabela `agent_config` via `supabase db query --linked` com SQL passado por linha de comando no PowerShell corrompeu **todos os registros** (`agent_name`, `agent_avatar`, `agent_description`, `agent_suggestions`, `system_prompt`) — o shell interpretou mal aspas/escapes e sobrescreveu tudo com lixo.

- **Corrigido** restaurando os valores corretos via arquivo SQL (evita problema de escaping).
- O **avatar original do agente foi perdido** (imagem era só no banco, sem backup em repo). `agent_avatar` ficou vazio e o app mostra o ícone padrão do Sheep. **O usuário deve reenviar a imagem no admin-app → Settings.**
- **Lição:** nunca passar SQL multi-linha com aspas por argumento de linha de comando — sempre usar `--file`.

---

## 3. Nova arquitetura do agente (controle total)

### 3.1 Prompt 100% do admin-app

- **Removido `DEFAULT_SYSTEM_PROMPT`** do código da edge function (antes havia um prompt da persona "ovelha TJ" no código).
- A edge function lê **somente** `agent_config.system_prompt` (via admin-app → PromptEditor).
- **Prompt vazio/ausente →** o Sheep responde: *"O Sheep ainda não foi configurado. Peça ao administrador para definir o prompt no painel de administração."* — **sem fallback escondido**.
- Placeholders disponíveis para o admin usar no prompt: `{userName}`, `{userStatus}`, `{dayNumber}`, `{readingContext}`, `{userNotes}`, `{searchContext}` (fontes), `{agentName}`.
- **Otimização:** contexto (`{searchContext}`, `{userNotes}`) só é buscado **se o prompt contiver o placeholder** — nada de contexto oculto injetado sem o admin pedir.

### 3.2 Fontes 100% do admin-app

- **Removido o scraping ao vivo do WOL** (`fetchVerseFromWOL`) — era fonte externa fora do controle do admin.
- **Removida a busca direta em `verses`** (no workspace; o projeto real usava WOL).
- A busca usa **somente** a tabela `knowledge_base` (admin-app → Base de Conhecimento), via RPC `search_knowledge_base_fts`.
- Resultados formatados como `[Fonte N] título\nconteúdo` e injetados via `{searchContext}`.

### 3.3 FTS v2 — busca tolerante a linguagem natural

O `plainto_tsquery` (AND de todas as palavras) falhava em perguntas como *"Quantas geras tem um siclo?"* porque termos como "quantas"/"tem" quebravam o match. A RPC `search_knowledge_base_fts` foi reescrita para **OR de termos com ranking** (`ts_rank`), muito mais adequada a perguntas de usuário. Verificado ao vivo: "Quantas geras tem um siclo?" → achou o artigo "Dinheiro e pesos nas Escrituras".

### 3.4 Trigger de indexação automática

Novos artigos adicionados/editados no admin-app **não ganhavam `search_vector`** (a coluna ficava NULL e o artigo não era buscável). Criado trigger `trg_knowledge_base_search_vector` (BEFORE INSERT OR UPDATE OF title, content) que mantém o `search_vector` atualizado automaticamente.

---

## 4. Edge function — versão final

Arquivo: `supabase/functions/bible-agent/index.ts` (projeto real).

**Descoberta crítica da sessão:** o repositório real tinha uma versão **diferente** da workspace (OneDrive). A versão do projeto real tinha autenticação obrigatória (JWT), CORS restrito e busca WOL; a workspace não tinha auth. Foi publicado por engano a versão workspace (sem auth). **Corrigido:** a versão final publicada é baseada no projeto real — mantém **auth obrigatória** (401 sem token), **CORS restrito**, **salvamento de histórico**, retry de 429 com rodízio de chaves (3 tentativas) — e aplica os requisitos de controle total.

**Ambientes sincronizados:** o arquivo do workspace foi sobrescrito com o mesmo conteúdo do projeto real.

---

## 5. admin-app

- **PromptEditor:** adicionada dica visual com os placeholders disponíveis e nota de que a base de conhecimento é a página "Base de Conhecimento". (Build OK, deployado.)
- Deploy em produção: **https://admin-app-two-orcin.vercel.app**
- Confirmação: `admin-app.vercel.app` **não pertence** a esta conta Vercel (é projeto não relacionado). O domínio real do painel é `admin-app-two-orcin.vercel.app`.
- Deploy via CLI (o usuário já estava logado na Vercel): `npx vercel --prod --yes`.

---

## 6. Testes realizados (edge function)

| Teste | Resultado |
|---|---|
| Prompt do admin aplicado | ✓ Respondeu focando nas funcionalidades do app |
| Prompt vazio (sem config) | ✓ Responde aviso de "não configurado", sem fallback |
| Busca com `{searchContext}` | ✓ Respondeu citando "Fonte 1" — conteúdo só da knowledge_base |
| Pergunta fora das fontes | ✓ "Não encontrei isso nas fontes carregadas pelo administrador" |
| FTS v2 (linguagem natural) | ✓ "Quantas geras tem um siclo?" achou o artigo correto |

---

## 7. Git e deploy

- Edge function `bible-agent` publicada (2x nesta sessão — versão workspace por engano, depois versão correta) via `supabase functions deploy`.
- admin-app publicado via `vercel --prod`.
- Migração `023_knowledge_base_fts_v2_and_trigger.sql` adicionada ao repo (FTS v2 + trigger). Aplicada em produção via `db query --file` (equivalente ao `db push`).

---

## 8. Pendências em aberto

| # | Item | Por que ficou de fora |
|---|------|------------------------|
| 1 | **Reenviar avatar do Sheep no admin-app** | Imagem original se perdeu na corrupção de `agent_config`; sem backup em repo |
| 2 | O usuário definir o **prompt final** do Sheep no PromptEditor | O prompt atual no banco é um placeholder de suporte do app, escrito pela IA; o usuário quer escrever o dele |
| 3 | Definir se o usuário quer artigos novos na knowledge_base (hoje tem 1830 artigos da TNM) | Base atual é texto da Bíblia (TNM) carregado em sessão anterior |
| 4 | Decidir futuro da busca vetorial (`embedding` VECTOR(384)) | Embeddings antigos são de outro modelo; novos artigos ficam sem embedding (FTS não precisa) |
| 5 | `admin-app.vercel.app` pertence a outra conta — verificar se é projeto do usuário ou de terceiro | Levantado, não resolvido |
| 6 | Publicar no GitHub as mudanças do repositório local | Repo local sem remote configurado |
| 7 | CVEs de `react-router` em ambos os apps (da sessão anterior) | Continua pendente por decisão deliberada (SSR/RSC não usado) |

---

## Arquivos-chave desta sessão

- `supabase/functions/bible-agent/index.ts` (projeto real + workspace sincronizados)
- `supabase/migrations/023_knowledge_base_fts_v2_and_trigger.sql`
- `admin-app/src/pages/PromptEditor.tsx`
- `.claude/CONTEXTO.md`, `.claude/CLAUDE.md` (atualizados)
