CREATE POLICY "Users can update own progress"
ON reading_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
