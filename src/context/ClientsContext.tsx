import { createContext, useContext, useState, type ReactNode } from "react";

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

type Ctx = {
  clients: Client[];
  addClient: (c: Omit<Client, "id">) => Client;
  updateClient: (id: string, patch: Partial<Omit<Client, "id">>) => void;
  deleteClient: (id: string) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  editingClientId: string | null;
  openClientDialog: () => void;
  openClientDialogFor: (id: string | null) => void;
  clientDialogOpen: boolean;
  setClientDialogOpen: (v: boolean) => void;
};

const ClientsContext = createContext<Ctx | null>(null);

const seed: Client[] = [
  {
    id: "c1",
    name: "קפה שקד",
    industry: "בתי קפה",
    targetAudience: "צעירים 20-35, אוהבי קפה איכותי",
    brandVibe: "חמים, קהילתי, אותנטי",
    coreOffers: "קפה מיוחד, מאפים ביתיים, סדנאות ברייסטה",
    brandColors: ["#3E2723", "#D7A86E", "#F5F0E6"],
    brief: "",
  },
  {
    id: "c2",
    name: "סטודיו נועה",
    industry: "יוגה וכושר",
    targetAudience: "נשים 25-50, אורח חיים בריא",
    brandVibe: "רגוע, מעצים, מקצועי",
    coreOffers: "שיעורי יוגה, פילאטיס, סדנאות נשימה",
    brandColors: ["#0B192C", "#1E67FF", "#F5F5F7"],
    brief: "",
  },
  {
    id: "c3",
    name: "אורבן פיטנס",
    industry: "חדרי כושר",
    targetAudience: "גברים 18-40, ספורטאים",
    brandVibe: "עוצמתי, אורבני, נחוש",
    coreOffers: "אימונים אישיים, קבוצתי HIIT, תוכניות תזונה",
    brandColors: ["#111111", "#FF3B30", "#FAFAFA"],
    brief: "",
  },
];

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(seed);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const addClient: Ctx["addClient"] = (c) => {
    const created = { ...c, id: `c${Date.now()}` };
    setClients((prev) => [created, ...prev]);
    return created;
  };

  const updateClient: Ctx["updateClient"] = (id, patch) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  };

  const deleteClient: Ctx["deleteClient"] = (id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    setSelectedClientId((cur) => (cur === id ? null : cur));
  };

  const openClientDialogFor: Ctx["openClientDialogFor"] = (id) => {
    setEditingClientId(id);
    setClientDialogOpen(true);
  };

  return (
    <ClientsContext.Provider
      value={{
        clients,
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
