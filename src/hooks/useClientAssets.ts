import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AssetKind = "photo" | "reference";

export type ClientAsset = {
  id: string;
  storagePath: string;
  url: string;
  kind: AssetKind;
};

const BUCKET = "client-assets";
const SIGN_TTL = 60 * 60; // 1 hour

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

export function useClientAssets(
  clientId: string | null,
  kind: AssetKind = "photo",
) {
  const qc = useQueryClient();
  const key = ["client-assets", clientId, kind] as const;

  const query = useQuery({
    queryKey: key,
    enabled: !!clientId,
    queryFn: async (): Promise<ClientAsset[]> => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("client_assets")
        .select("id,storage_path,kind")
        .eq("client_id", clientId)
        .eq("kind", kind)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        id: string;
        storage_path: string;
        kind: AssetKind;
      }>;
      const signed = await signMany(rows.map((r) => r.storage_path));
      return rows.map((r) => ({
        id: r.id,
        storagePath: r.storage_path,
        url: signed[r.storage_path] ?? "",
        kind: r.kind,
      }));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!clientId) throw new Error("Missing client");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filename = `${crypto.randomUUID()}.${ext}`;
        const path = `${user.id}/${clientId}/${filename}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("client_assets").insert({
          client_id: clientId,
          user_id: user.id,
          storage_path: path,
          kind,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (asset: ClientAsset) => {
      await supabase.storage.from(BUCKET).remove([asset.storagePath]);
      const { error } = await supabase
        .from("client_assets")
        .delete()
        .eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const uploadFiles = useCallback(
    (files: File[]) => uploadMutation.mutateAsync(files),
    [uploadMutation],
  );
  const deleteAsset = useCallback(
    (asset: ClientAsset) => deleteMutation.mutateAsync(asset),
    [deleteMutation],
  );

  return {
    assets: query.data ?? [],
    isLoading: query.isLoading,
    uploading: uploadMutation.isPending,
    uploadFiles,
    deleteAsset,
  };
}
