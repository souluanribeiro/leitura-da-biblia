-- Migration: Add reading_start_date to profiles
-- Execute this SQL in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reading_start_date DATE;
