-- Add preferred_language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add check constraint for supported languages
ALTER TABLE public.profiles
ADD CONSTRAINT valid_language CHECK (preferred_language IN ('en', 'fr', 'es', 'pt', 'de', 'ar'));