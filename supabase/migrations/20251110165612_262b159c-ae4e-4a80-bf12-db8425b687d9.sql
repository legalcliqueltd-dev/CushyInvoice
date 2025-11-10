-- Add trial_end_date column to profiles table
ALTER TABLE profiles
ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE;