import { createContext, useContext, useState, type ReactNode } from "react";

export type Client = {
  id: string;
  name: string;
  industry: string;
  targetAudience: string;
  brandColors: string[];
};

type Ctx = {
  clients: Client[];
  addClient: (c: Omit<Client, "id">) => Client;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  openClientDialog: () => void;
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
    brandColors: ["#3E2723", "#D7A86E", "#F5F0E6"],
  },
  {
    id: "c2",
    name: "סטודיו נועה",
    industry: "יוגה וכושר",
    targetAudience: "נשים 25-50, אורח חיים בריא",
    brandColors: ["#0B192C", "#1E67FF", "#F5F5F7"],
  },
  {
    id: "c3",
    name: "אורבן פיטנס",
    industry: "חדרי כושר",
    targetAudience: "גברים 18-40, ספורטאים",
    brandColors: ["#111111", "#FF3B30", "#FAFAFA"],
  },
];

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(seed);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  const addClient: Ctx["addClient"] = (c) => {
    const created = { ...c, id: `c${Date.now()}` };
    setClients((prev) => [created, ...prev]);
    return created;
  };

  return (
    <ClientsContext.Provider
      value={{
        clients,
        addClient,
        selectedClientId,
        setSelectedClientId,
        clientDialogOpen,
        setClientDialogOpen,
        openClientDialog: () => setClientDialogOpen(true),
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
