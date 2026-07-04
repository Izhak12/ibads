import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Download, FolderOpen, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useClients } from "@/context/ClientsContext";
import {
  useGraphicFolders,
  useGraphicsForClient,
  type GeneratedGraphic,
} from "@/hooks/useGeneratedGraphics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ease = [0.22, 1, 0.36, 1] as const;

export function GalleryScreen() {
  const { clients } = useClients();
  const { data: folders = [], isLoading: foldersLoading } = useGraphicFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of folders) map.set(f.clientId, f.count);
    return map;
  }, [folders]);

  const activeClient = clients.find((c) => c.id === selectedFolderId) ?? null;

  return (
    <div className="flex-1 h-screen overflow-y-auto" dir="rtl">
      <div className="max-w-6xl mx-auto px-10 py-12">
        <AnimatePresence mode="wait">
          {!selectedFolderId ? (
            <motion.div
              key="folders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
            >
              <header className="mb-10">
                <h1 className="text-3xl font-semibold text-[#0B192C] tracking-tight">
                  גלריית עיצובים
                </h1>
                <p className="text-sm text-black/50 mt-2">
                  כל העיצובים שנוצרו, מסודרים לפי לקוח.
                </p>
              </header>

              {foldersLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-6 h-6 animate-spin text-black/30" />
                </div>
              ) : clients.length === 0 ? (
                <EmptyState text="אין לקוחות עדיין. הוסף לקוח כדי להתחיל." />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {clients.map((c, i) => {
                    const count = folderCounts.get(c.id) ?? 0;
                    const disabled = count === 0;
                    const accent = c.brandColors?.[0] ?? "#0B192C";
                    const initial = c.name?.trim()?.[0]?.toUpperCase() ?? "?";
                    return (
                      <motion.button
                        key={c.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.4, ease }}
                        onClick={() => !disabled && setSelectedFolderId(c.id)}
                        disabled={disabled}
                        className={`group text-right rounded-2xl bg-white border border-black/5 shadow-[0_10px_30px_-20px_rgba(11,25,44,0.35)] p-5 transition-all ${
                          disabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:shadow-[0_20px_40px_-20px_rgba(11,25,44,0.4)] hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-6">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-semibold shrink-0"
                            style={{ backgroundColor: accent }}
                          >
                            {initial}
                          </div>
                          <FolderOpen className="w-5 h-5 text-black/30 group-hover:text-[#0B192C] transition-colors" />
                        </div>
                        <div className="text-base font-medium text-[#0B192C] truncate">
                          {c.name}
                        </div>
                        <div className="mt-1 text-xs text-black/50">
                          {count} עיצובים
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`folder-${selectedFolderId}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
            >
              <button
                onClick={() => setSelectedFolderId(null)}
                className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-[#0B192C] transition-colors mb-6"
              >
                <ArrowRight className="w-4 h-4" />
                חזור לכל התיקיות
              </button>
              <header className="mb-8">
                <h1 className="text-3xl font-semibold text-[#0B192C] tracking-tight">
                  {activeClient?.name ?? "לקוח"}
                </h1>
                <p className="text-sm text-black/50 mt-2">
                  {folderCounts.get(selectedFolderId) ?? 0} עיצובים שמורים
                </p>
              </header>
              <FolderDetail clientId={selectedFolderId} clientName={activeClient?.name ?? "graphic"} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FolderDetail({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { graphics, isLoading, deleteGraphic, deleting } = useGraphicsForClient(clientId);
  const [toDelete, setToDelete] = useState<GeneratedGraphic | null>(null);

  const fileBase = clientName.replace(/\s+/g, "-").toLowerCase();

  const handleDownload = async (g: GeneratedGraphic, idx: number) => {
    try {
      const res = await fetch(g.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase}-${idx + 1}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("שגיאה בהורדה", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteGraphic(toDelete);
      toast.success("העיצוב נמחק");
    } catch (err) {
      toast.error("שגיאה במחיקה", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-black/30" />
      </div>
    );
  }

  if (graphics.length === 0) {
    return <EmptyState text="עדיין אין עיצובים שמורים ללקוח זה." />;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {graphics.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.4, ease }}
            className="relative rounded-2xl overflow-hidden bg-[#0B192C]/5 shadow-[0_10px_30px_-15px_rgba(11,25,44,0.35)] border border-black/5 group"
            style={{ aspectRatio: "1 / 1" }}
          >
            <img
              src={g.url}
              alt={g.headline}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDownload(g, i)}
                className="w-10 h-10 rounded-full bg-white/95 backdrop-blur text-[#0B192C] flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                aria-label="הורד"
                title="הורדה"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setToDelete(g)}
                className="w-10 h-10 rounded-full bg-white/95 backdrop-blur text-red-600 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                aria-label="מחק"
                title="מחיקה"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק את העיצוב?</AlertDialogTitle>
            <AlertDialogDescription>
              לא ניתן לשחזר את הפעולה. הקובץ יימחק לצמיתות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "מוחק…" : "מחק"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mb-4">
        <FolderOpen className="w-6 h-6 text-black/30" />
      </div>
      <div className="text-sm text-black/50">{text}</div>
    </div>
  );
}
