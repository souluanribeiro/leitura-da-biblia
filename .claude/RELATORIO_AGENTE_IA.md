# Relatório de Análise — Agente IA "Sheep"

> Análise gerada em 29/07/2026. Este documento é diagnóstico — nenhuma alteração de código foi feita. Destinado a orientar quem for implementar as correções.

---

## Resumo executivo

O agente relatado como "não inteligente" e que "muda as palavras dos textos bíblicos" tem **duas causas raiz identificadas no código**, mais um conjunto de trabalho de melhoria já iniciado nesta mesma data (29/07) e não finalizado. Não é um problema de qual provedor de IA está sendo usado — é estrutural no fluxo de resposta e na forma como a base de conhecimento é alimentada.

---

## 1. Causa raiz dos dois sintomas reportados

### 1.1 "Respostas não trazidas de forma inteligente"

**Arquivo:** `supabase/functions/bible-agent/index.ts`, linhas 299–306

```ts
if (kbResult) {
  await saveChatMessage(supabase, userId, "user", message, conversationId)
  await saveChatMessage(supabase, userId, "assistant", kbResult, conversationId)

  return new Response(JSON.stringify({ reply: kbResult }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
```

Quando a busca na base de conhecimento (`searchKnowledgeBase`) encontra qualquer resultado — via scraping do WOL ou busca full-text — esse texto bruto é devolvido **diretamente ao usuário**, sem nunca passar pelo modelo de IA. Ou seja: nos casos em que a base "acha algo", a resposta não é gerada por IA nenhuma — é um dump de texto concatenado. Isso explica por que a resposta parece mecânica/burra: literalmente não há raciocínio nenhum acontecendo ali.

### 1.2 "Muda as palavras dos textos bíblicos"

**Mesmo arquivo, linha 315:**

```ts
const systemPrompt = (agentConfig.system_prompt || DEFAULT_SYSTEM_PROMPT)
  ...
  .replace("{searchContext}", "")
```

Quando a busca na base **não** encontra nada, o código cai no fallback de IA pura — mas o placeholder `{searchContext}` do prompt é substituído por uma string vazia. O `DEFAULT_SYSTEM_PROMPT` instrui o modelo a "copiar exatamente" versículos da base de conhecimento (regras 2 e 3), mas nesse caminho não há nenhum texto de base sendo injetado — a instrução não tem o que citar. O modelo (Llama 3.3 70B via Groq) então recorre à própria memória de treinamento para "lembrar" o texto da Tradução do Novo Mundo, e erra a redação exata. É isso que aparece como "mudar as palavras".

**Conclusão dos dois pontos:** o prompt já foi escrito corretamente prevendo citação fiel a partir da base — o problema é que o pipeline de busca/injeção de contexto não sustenta essa promessa em nenhum dos dois caminhos possíveis (nem quando acha, nem quando não acha).

---

## 2. Trabalho já iniciado hoje (29/07) e não finalizado

Há evidência de que esse mesmo problema já estava sendo atacado, mas ficou pela metade:

- **`supabase/migrations/017_pgvector_knowledge_base.sql`** (criada hoje): adiciona coluna `embedding VECTOR(384)` à tabela `knowledge_base` e cria a função `match_knowledge_base()` para busca semântica por similaridade de vetor.
- **`supabase/migrations/018_knowledge_base_fts.sql`** (criada hoje): cria busca full-text em português (`search_knowledge_base_fts()`) — **esta função já está sendo chamada** pelo edge function (Strategy 2 em `searchKnowledgeBase`).
- **`scripts/pdf_to_kb.py`**: script Python pronto para extrair texto de PDFs, gerar embeddings (modelo local `all-MiniLM-L6-v2` ou API Hugging Face) e inserir na `knowledge_base`.
- **`scripts/pdfs/Bíblia_nwt_T.pdf`**: o PDF completo da Tradução do Novo Mundo já está na pasta, pronto para ser processado.

**O que falta:**

1. `match_knowledge_base()` (busca vetorial) **nunca é chamada** pelo edge function — só a FTS por palavra-chave está ligada. A infraestrutura de embedding existe mas não está conectada ao fluxo de chat.
2. `chunk_text()` em `pdf_to_kb.py` corta o texto **por parágrafo, até ~1500 caracteres**, sem qualquer noção de fronteira de versículo e sem armazenar metadata de livro/capítulo/versículo. Mesmo rodando a ingestão hoje, pedir "Gênesis 1:3" não garante retornar exatamente Gênesis 1:3 — pode devolver um bloco que mistura versículos vizinhos ou corta um no meio.

---

## 3. Contradição com as próprias regras do projeto

O `CLAUDE.md` do projeto diz explicitamente:

> **Bíblia copyright:** NUNCA usar API JW.ORG em código final. Usar links externos `wol.jw.org`.

Mas `index.ts` (linhas 112–143, função `fetchVerseFromWOL`) faz scraping ao vivo de `wol.jw.org` via regex sobre HTML, ativado como "Strategy 1" da busca. Isso:
- Contradiz a regra que o próprio projeto define.
- É frágil — qualquer mudança de marcação HTML no site da Watchtower quebra silenciosamente o parsing (retorna string vazia sem erro visível).
- Já foi identificado como lento (`CONTEXTO.md` menciona "~15s" e diz que a busca WOL foi desativada) — mas **o código mostra que ela continua ativa**. Documentação e código estão dessincronizados nesse ponto.

Com o PDF da TNM já disponível localmente (seção 2), essa dependência externa deixa de ser necessária.

---

## 4. Groq vs. Gemini — limite de requisições

Durante a conversa, foi relatado que o projeto teria migrado de Groq para Gemini e está estourando limite rápido. **Observação importante:** o arquivo `index.ts` atualmente no disco ainda referencia exclusivamente Groq (`GROQ_API_URL`, modelo `llama-3.3-70b-versatile`, variável `GROQ_API_KEYS`) — não há nenhuma referência a Gemini no código local. Como a pasta `supabase/functions/` inteira está **fora do controle de versão** (git) e o deploy é manual, é possível que a troca tenha sido feita e publicada por fora deste arquivo. **Recomenda-se confirmar qual código está realmente publicado no Supabase antes de qualquer nova alteração**, para não perder ou sobrescrever uma versão que não está refletida aqui.

Independente do provedor escolhido, os pontos que realmente decidem se o free tier aguenta escala:

- **Rotação de múltiplas API keys** — o código já implementa isso para Groq (`getNextKey()`, `GROQ_API_KEYS` separadas por vírgula, retry automático em 429). Essa mesma estratégia deveria ser replicada para qualquer provedor escolhido, já que cada conta gratuita gera uma key própria.
- **Modelo específico importa mais que o provedor** — dentro da família Gemini, por exemplo, modelos "Pro" têm free tier bem mais restrito que os "Flash"/"Flash-Lite".
- **O maior fator de sustentabilidade é o volume de chamadas ao modelo, não o provedor.** Hoje, toda mensagem sem match na base vira uma chamada de IA. Corrigir os problemas da seção 1 (parar de devolver dump cru, sempre buscar contexto) já reduz esse volume. Complementar com cache de perguntas frequentes e um limite diário de perguntas por usuário é o que de fato sustenta "milhares de usuários" sem estourar qualquer free tier.

---

## 5. Recomendações priorizadas

**P0 — corrige os sintomas relatados diretamente**
1. Remover o retorno direto de `kbResult` (linhas 299–306). Sempre passar pelo modelo de IA.
2. Nunca deixar `{searchContext}` vazio quando houver qualquer resultado de busca (FTS ou vetorial) — sempre injetar o que foi encontrado como contexto para a IA formular a resposta (e citar literalmente quando o texto estiver presente).

**P1 — sustenta citação bíblica fiel de verdade**
3. Reescrever `chunk_text()` em `pdf_to_kb.py` para extrair por versículo (regex de padrão "capítulo:versículo texto"), armazenando livro/capítulo/versículo como metadata própria, não texto solto.
4. Rodar a ingestão do PDF da TNM já presente em `scripts/pdfs/`.
5. Conectar `match_knowledge_base()` (busca vetorial, já existe na migração 017) ao fluxo do edge function, combinando com a FTS já ativa.
6. Aposentar o scraping ao vivo do WOL — resolve a contradição com `CLAUDE.md` e a lentidão já documentada.

**P2 — custo e escala**
7. Confirmar o que está de fato publicado no Supabase antes de decidir entre Groq/Gemini.
8. Replicar a rotação de múltiplas keys para o provedor escolhido.
9. Reduzir volume de chamadas via cache de perguntas comuns + limite diário por usuário.

**P3 — risco operacional**
10. `supabase/functions/`, `scripts/` e `supabase/migrations/` estão **fora do git** (`git status` mostra tudo como untracked). Para um app já em produção com usuários reais, isso significa zero histórico/rollback da lógica do agente e do schema do banco. Recomenda-se versionar essas pastas.
11. Ponto de atenção (não é parecer jurídico): armazenar o texto completo da TNM na própria base de dados para retrieval é um uso diferente de apenas linkar para `wol.jw.org`, que é a prática que o próprio `CLAUDE.md` já adota deliberadamente por causa de direitos autorais. Vale confirmar se esse uso está dentro dos termos da Watchtower antes de ir para produção com essa mudança.

---

## Arquivos-chave mencionados

- `supabase/functions/bible-agent/index.ts` — lógica do agente (linhas 299–306, 315, 112–143)
- `supabase/migrations/017_pgvector_knowledge_base.sql`
- `supabase/migrations/018_knowledge_base_fts.sql`
- `scripts/pdf_to_kb.py`
- `scripts/pdfs/Bíblia_nwt_T.pdf`
- `.claude/CLAUDE.md` (regra de copyright contradita)
- `.claude/CONTEXTO.md` (documentação desatualizada sobre WOL)
