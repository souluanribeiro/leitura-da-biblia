-- Restrict admin_notifications to admin users only
DROP POLICY IF EXISTS "Admins manage notifications" ON admin_notifications;
CREATE POLICY "Admin read notifications"
  ON admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admin insert notifications"
  ON admin_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admin update notifications"
  ON admin_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admin delete notifications"
  ON admin_notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Restrict push_subscriptions select to admin users (users manage own via the app)
DROP POLICY IF EXISTS "Admins manage push_subscriptions" ON push_subscriptions;
CREATE POLICY "Admin read push_subscriptions"
  ON push_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Restrict reading_progress select to admin users
DROP POLICY IF EXISTS "Admins manage reading_progress" ON reading_progress;
CREATE POLICY "Admin read reading_progress"
  ON reading_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Restrict profiles select to admin users (non-admins should only see own profile)
DROP POLICY IF EXISTS "Admin read profiles" ON profiles;
CREATE POLICY "Admin read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
    )
  );

-- Ensure knowledge_base maintains public read (already set), admin write only
DROP POLICY IF EXISTS "Admin insert knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Admin update knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Admin delete knowledge_base" ON knowledge_base;
CREATE POLICY "Admin insert knowledge_base"
  ON knowledge_base FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admin update knowledge_base"
  ON knowledge_base FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
CREATE POLICY "Admin delete knowledge_base"
  ON knowledge_base FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Restrict agent_config admin write
DROP POLICY IF EXISTS "Admin modify agent_config" ON agent_config;
CREATE POLICY "Admin modify agent_config"
  ON agent_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
