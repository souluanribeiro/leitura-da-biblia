CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT DEFAULT 'Nova conversa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false
);

ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User sees own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User creates own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User updates own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages conversations"
  ON conversations FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages chat_history"
  ON chat_history FOR ALL
  USING (true)
  WITH CHECK (true);