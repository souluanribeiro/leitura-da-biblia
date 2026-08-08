-- Sincronização de perfil entre dispositivos
-- Colunas adicionais na tabela profiles para guardar os dados que eram
-- salvos apenas no localStorage (foto, nome, idade, batismo).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS baptized BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS baptism_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS intends_to_get_baptized BOOLEAN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo TEXT;

-- Garantir que cada usuário leia e atualize o próprio perfil (idempotente)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
