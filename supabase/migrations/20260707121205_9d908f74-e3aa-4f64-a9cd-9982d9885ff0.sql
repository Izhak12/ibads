ALTER TABLE public.generated_graphics
  ADD COLUMN IF NOT EXISTS primary_text text,
  ADD COLUMN IF NOT EXISTS link_headline text;