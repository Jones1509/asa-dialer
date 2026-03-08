
CREATE TABLE public.tetris_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  player_name text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  lines_cleared integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tetris_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view scores"
  ON public.tetris_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own scores"
  ON public.tetris_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
