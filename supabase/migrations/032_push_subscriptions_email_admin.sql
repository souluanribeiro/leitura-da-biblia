-- push_subscriptions: e-mail do usuário para exibição no admin + limpeza de inscrições inválidas

-- 1. Coluna user_email (desnormalizada, como no chat_history)
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 2. Backfill dos registros existentes a partir de auth.users
UPDATE push_subscriptions ps
SET user_email = u.email
FROM auth.users u
WHERE ps.user_id = u.id
  AND ps.user_email IS NULL;

-- 3. Admin pode excluir inscrições antigas/inativas (usuários continuam podendo
--    apagar apenas as próprias — política "Users delete own subscriptions")
DROP POLICY IF EXISTS "Admin delete push_subscriptions" ON push_subscriptions;
CREATE POLICY "Admin delete push_subscriptions"
  ON push_subscriptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );
