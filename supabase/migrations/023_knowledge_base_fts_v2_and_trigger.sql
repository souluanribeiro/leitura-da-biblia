-- Busca FTS na knowledge_base otimizada para perguntas em linguagem natural.
-- Usa OR de termos (em vez de AND do plainto_tsquery), que falhava em perguntas
-- como "Quantas geras tem um siclo?" (termos extras como "quantas"/"tem" quebravam o AND).
CREATE OR REPLACE FUNCTION search_knowledge_base_fts(
  search_query TEXT,
  match_count INT DEFAULT 8
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  content TEXT,
  rank REAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  terms TSVECTOR;
  or_query TSQUERY;
BEGIN
  terms := to_tsvector('portuguese', search_query);

  SELECT to_tsquery('portuguese', string_agg(lexeme, ' | '))
  INTO or_query
  FROM (SELECT DISTINCT lexeme FROM unnest(terms)) t;

  IF or_query IS NULL THEN
    or_query := plainto_tsquery('portuguese', search_query);
  END IF;

  RETURN QUERY
    SELECT
      kb.id,
      kb.title,
      kb.content,
      ts_rank(kb.search_vector, or_query) AS rank
    FROM knowledge_base kb
    WHERE kb.search_vector @@ or_query
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$;

-- Trigger para manter search_vector atualizado quando o admin-app
-- adiciona/edita artigos na knowledge_base.
CREATE OR REPLACE FUNCTION knowledge_base_update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('portuguese', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_knowledge_base_search_vector ON knowledge_base;
CREATE TRIGGER trg_knowledge_base_search_vector
  BEFORE INSERT OR UPDATE OF title, content ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION knowledge_base_update_search_vector();

-- Backfill de artigos que porventura estejam sem search_vector
UPDATE knowledge_base
SET search_vector = to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(content, ''))
WHERE search_vector IS NULL;
