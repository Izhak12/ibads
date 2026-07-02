import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Client = {
  id: string;
  name: string;
  industry: string;
  targetAudience: string;
  brandVibe: string;
  coreOffers: string;
  brandColors: string[];
  brief: string;
};

type ClientRow = {
  id: string;
  name: string;
  industry: string;
  target_audience: string;
  brand_vibe: string;
  core_offers: string;
  brand_colors: string[];
  brief: string;
};

const fromRow = (r: ClientRow): Client => ({
  id: r.id,
  name: r.name,
  industry: r.industry,
  targetAudience: r.target_audience,
  brandVibe: r.brand_vibe,
  coreOffers: r.core_offers,
  brandColors: r.brand_colors ?? [],
  brief: r.brief,
});

const toRowPayload = (c: Omit<Client, "id">) => ({
  name: c.name,
  industry: c.industry,
  target_audience: c.targetAudience,
  brand_vibe: c.brandVibe,
  core_offers: c.coreOffers,
  brand_colors: c.brandColors,
  brief: c.brief,
});

type Ctx = {
  clients: Client[];
  isLoading: boolean;
  addClient: (c: Omit<Client, "id">) => Promise<Client>;
  updateClient: (
    id: string,
    patch: Partial<Omit<Client, "id">>,
  ) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  editingClientId: string | null;
  openClientDialog: () => void;
  openClientDialogFor: (id: string | null) => void;
  clientDialogOpen: boolean;
  setClientDialogOpen: (v: boolean) => void;
};

const ClientsContext = createContext<Ctx | null>(null);

const QUERY_KEY = ["clients"] as const;

export function ClientsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Client[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("clients")
        .select(
          "id,name,industry,target_audience,brand_vibe,core_offers,brand_colors,brief",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => fromRow(r as ClientRow));
    },
  });

  const addMutation = useMutation({
    mutationFn: async (c: Omit<Client, "id">): Promise<Client> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("לא מחובר");
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...toRowPayload(c), user_id: user.id })
        .select(
          "id,name,industry,target_audience,brand_vibe,core_offers,brand_colors,brief",
        )
        .single();
      if (error) throw error;
      return fromRow(data as ClientRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<Client, "id">>;
    }) => {
      const row: {
        name?: string;
        industry?: string;
        target_audience?: string;
        brand_vibe?: string;
        core_offers?: string;
        brand_colors?: string[];
        brief?: string;
      } = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.industry !== undefined) row.industry = patch.industry;
      if (patch.targetAudience !== undefined)
        row.target_audience = patch.targetAudience;
      if (patch.brandVibe !== undefined) row.brand_vibe = patch.brandVibe;
      if (patch.coreOffers !== undefined) row.core_offers = patch.coreOffers;
      if (patch.brandColors !== undefined) row.brand_colors = patch.brandColors;
      if (patch.brief !== undefined) row.brief = patch.brief;
      const { error } = await supabase.from("clients").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });


  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      setSelectedClientId((cur) => (cur === id ? null : cur));
    },
  });

  const addClient: Ctx["addClient"] = useCallback(
    (c) => addMutation.mutateAsync(c),
    [addMutation],
  );

  const updateClient: Ctx["updateClient"] = useCallback(
    async (id, patch) => {
      await updateMutation.mutateAsync({ id, patch });
    },
    [updateMutation],
  );

  const deleteClient: Ctx["deleteClient"] = useCallback(
    async (id) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  const openClientDialogFor: Ctx["openClientDialogFor"] = (id) => {
    setEditingClientId(id);
    setClientDialogOpen(true);
  };

  return (
    <ClientsContext.Provider
      value={{
        clients,
        isLoading,
        addClient,
        updateClient,
        deleteClient,
        selectedClientId,
        setSelectedClientId,
        editingClientId,
        clientDialogOpen,
        setClientDialogOpen: (v) => {
          setClientDialogOpen(v);
          if (!v) setEditingClientId(null);
        },
        openClientDialog: () => {
          setEditingClientId(null);
          setClientDialogOpen(true);
        },
        openClientDialogFor,
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
}
