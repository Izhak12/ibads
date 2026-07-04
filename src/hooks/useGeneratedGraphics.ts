import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GeneratedGraphic = {
  id: string;
  clientId: string;
  storagePath: string;
  url: string;
  headline: string;
  subheadline: string;
  cta: string;
  createdAt: string;
};

export type FolderSummary = {
  clientId: string;
  count: number;
};

const BUCKET = "generated-graphics";
const SIGN_TTL = 60 * 60;

async function signMany(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGN_TTL);
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

const foldersKey = ["generated-graphics", "folders"] as const;
const listKey = (clientId: string | null) =>
  ["generated-graphics", "list", clientId] as const;

export function useGraphicFolders() {
  return useQuery({
    queryKey: foldersKey,
    queryFn: async (): Promise<FolderSummary[]> => {
      const { data, error } = await supabase
        .from("generated_graphics")
        .select("client_id");
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data ?? []) as Array<{ client_id: string }>) {
        counts.set(row.client_id, (counts.get(row.client_id) ?? 0) + 1);
      }
      return Array.from(counts, ([clientId, count]) => ({ clientId, count }));
    },
  });
}

export function useGraphicsForClient(clientId: string | null) {
  const qc = useQueryClient();
  const key = listKey(clientId);

  const query = useQuery({
    queryKey: key,
    enabled: !!clientId,
    queryFn: async (): Promise<GeneratedGraphic[]> => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("generated_graphics")
        .select("id,client_id,storage_path,headline,subheadline,cta,created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        id: string;
        client_id: string;
        storage_path: string;
        headline: string;
        subheadline: string;
        cta: string;
        created_at: string;
      }>;
      const signed = await signMany(rows.map((r) => r.storage_path));
      return rows.map((r) => ({
        id: r.id,
        clientId: r.client_id,
        storagePath: r.storage_path,
        url: signed[r.storage_path] ?? "",
        headline: r.headline,
        subheadline: r.subheadline,
        cta: r.cta,
        createdAt: r.created_at,
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (g: GeneratedGraphic) => {
      await supabase.storage.from(BUCKET).remove([g.storagePath]);
      const { error } = await supabase
        .from("generated_graphics")
        .delete()
        .eq("id", g.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: foldersKey });
    },
  });

  const deleteGraphic = useCallback(
    (g: GeneratedGraphic) => deleteMutation.mutateAsync(g),
    [deleteMutation],
  );

  return {
    graphics: query.data ?? [],
    isLoading: query.isLoading,
    deleteGraphic,
    deleting: deleteMutation.isPending,
  };
}

function b64ToBlob(b64: string, contentType = "image/png"): Blob {
  const byteChars = atob(b64);
  const byteNumbers = new Array<number>(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: contentType });
}

export async function saveGeneratedGraphic(args: {
  clientId: string;
  imageB64: string;
  headline: string;
  subheadline: string;
  cta: string;
  designBrief?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const filename = `${crypto.randomUUID()}.png`;
  const path = `${user.id}/${args.clientId}/${filename}`;
  const blob = b64ToBlob(args.imageB64);
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { cacheControl: "3600", upsert: false, contentType: "image/png" });
  if (upErr) throw upErr;
  const { error: insErr } = await supabase.from("generated_graphics").insert({
    client_id: args.clientId,
    user_id: user.id,
    storage_path: path,
    headline: args.headline,
    subheadline: args.subheadline,
    cta: args.cta,
    design_brief: args.designBrief ?? "",
  });
  if (insErr) throw insErr;
}
