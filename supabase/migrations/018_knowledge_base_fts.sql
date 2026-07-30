ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

UPDATE knowledge_base SET search_vector = to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(content, ''));

CREATE INDEX IF NOT EXISTS idx_knowledge_base_fts ON knowledge_base USING GIN(search_vector);

CREATE OR REPLACE FUNCTION search_knowledge_base_fts(
  search_query TEXT,
  match_count INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  content TEXT,
  rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    ts_rank(kb.search_vector, plainto_tsquery('portuguese', search_query)) AS rank
  FROM knowledge_base kb
  WHERE kb.search_vector @@ plainto_tsquery('portuguese', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;
