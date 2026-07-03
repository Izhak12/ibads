
CREATE TABLE public.client_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_assets TO authenticated;
GRANT ALL ON public.client_assets TO service_role;

ALTER TABLE public.client_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own client_assets" ON public.client_assets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own client_assets" ON public.client_assets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own client_assets" ON public.client_assets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX client_assets_client_id_idx ON public.client_assets(client_id);

-- Storage policies: files live under {user_id}/{client_id}/{filename}
CREATE POLICY "Users read own client-assets files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'client-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own client-assets files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own client-assets files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'client-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
