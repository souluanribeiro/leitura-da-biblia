ALTER TABLE reading_progress
ADD COLUMN IF NOT EXISTS schedule_id TEXT NOT NULL DEFAULT '';

DROP POLICY IF EXISTS "Users can update own progress" ON reading_progress;
CREATE POLICY "Users can update own progress"
ON reading_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON reading_progress;
CREATE POLICY "Users can insert own progress"
ON reading_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own progress" ON reading_progress;
CREATE POLICY "Users can delete own progress"
ON reading_progress FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own progress" ON reading_progress;
CREATE POLICY "Users can view own progress"
ON reading_progress FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin read reading_progress" ON reading_progress;
CREATE POLICY "Admin read reading_progress"
ON reading_progress FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

ALTER TABLE reading_progress DROP CONSTRAINT IF EXISTS reading_progress_user_id_day_number_key;
ALTER TABLE reading_progress ADD CONSTRAINT reading_progress_user_id_day_schedule_key UNIQUE (user_id, day_number, schedule_id);
