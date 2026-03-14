CREATE TABLE public.tester_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  added_at timestamptz DEFAULT now(),
  notes text
);
ALTER TABLE public.tester_emails ENABLE ROW LEVEL SECURITY;