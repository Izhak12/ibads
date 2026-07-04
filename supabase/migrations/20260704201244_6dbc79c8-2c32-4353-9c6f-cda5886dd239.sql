
CREATE TABLE public.generated_graphics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  headline text NOT NULL DEFAULT '',
  subheadline text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT '',
  design_brief text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_graphics TO authenticated;
GRANT ALL ON public.generated_graphics TO service_role;

ALTER TABLE public.generated_graphics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own generated_graphics" ON public.generated_graphics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own generated_graphics" ON public.generated_graphics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own generated_graphics" ON public.generated_graphics
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX generated_graphics_client_id_idx ON public.generated_graphics(client_id);
CREATE INDEX generated_graphics_user_id_idx ON public.generated_graphics(user_id);

-- Storage policies: files live under {user_id}/{client_id}/{filename}
CREATE POLICY "Users read own generated-graphics files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'generated-graphics' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own generated-graphics files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-graphics' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own generated-graphics files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'generated-graphics' AND auth.uid()::text = (storage.foldername(name))[1]);
