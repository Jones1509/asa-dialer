CREATE TABLE public.twilio_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.twilio_config ENABLE ROW LEVEL SECURITY;