import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, type Tab } from "@/components/Sidebar";
import { CreateScreen } from "@/components/CreateScreen";
import { ClientsScreen } from "@/components/ClientsScreen";
import { AuthScreen } from "@/components/AuthScreen";
import { ClientDialog } from "@/components/ClientDialog";
import { ClientsProvider } from "@/context/ClientsContext";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

const ease = [0.22, 1, 0.36, 1] as const;

function Index() {
  const [tab, setTab] = useState<Tab>("create");

  return (
    <ClientsProvider>
      <div
        dir="rtl"
        className="flex h-screen w-full font-sans antialiased"
        style={{ backgroundColor: "#F5F5F7" }}
      >
        <Sidebar active={tab} onChange={setTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="flex flex-1 min-w-0"
          >
            {tab === "create" && <CreateScreen />}
            {tab === "clients" && <ClientsScreen />}
            {tab === "auth" && <AuthScreen />}
          </motion.div>
        </AnimatePresence>

        <ClientDialog />
        <Toaster position="top-center" />
      </div>
    </ClientsProvider>
  );
}
