import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, type Tab } from "@/components/Sidebar";
import { CreateScreen } from "@/components/CreateScreen";
import { ClientsScreen } from "@/components/ClientsScreen";
import { GalleryScreen } from "@/components/GalleryScreen";
import { AuthScreen } from "@/components/AuthScreen";
import { ClientDialog } from "@/components/ClientDialog";
import { ClientsProvider } from "@/context/ClientsContext";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: Index,
  ssr: false,
});

const ease = [0.22, 1, 0.36, 1] as const;

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("create");
  const qc = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      qc.invalidateQueries({ queryKey: ["clients"] });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const handleLogout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    setTab("create");
  };

  if (!ready) {
    return (
      <div
        dir="rtl"
        className="flex h-screen w-full items-center justify-center"
        style={{ backgroundColor: "#F5F5F7" }}
      />
    );
  }

  return (
    <ClientsProvider>
      <div
        dir="rtl"
        className="flex h-screen w-full font-sans antialiased"
        style={{ backgroundColor: "#F5F5F7" }}
      >
        {!session ? (
          <AuthScreen />
        ) : (
          <>
            <Sidebar active={tab} onChange={setTab} onLogout={handleLogout} />

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
              </motion.div>
            </AnimatePresence>

            <ClientDialog />
          </>
        )}

        <Toaster position="top-center" />
      </div>
    </ClientsProvider>
  );
}
