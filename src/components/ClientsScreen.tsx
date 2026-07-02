import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useClients, type Client } from "@/context/ClientsContext";
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

export function ClientsScreen() {
  const { clients, openClientDialog, openClientDialogFor, deleteClient } =
    useClients();
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);

  return (
    <div className="flex-1 h-screen overflow-y-auto">
      <div className="max-w-6xl mx-auto px-10 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-[#0B192C] tracking-tight">
              לקוחות
            </h1>
            <p className="text-sm text-black/50 mt-1">
              נהל את כל הלקוחות שלך במקום אחד
            </p>
          </div>
          <button
            onClick={openClientDialog}
            className="h-12 px-5 rounded-2xl bg-[#0B192C] text-white text-sm font-medium hover:bg-[#0B192C]/90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-[0_10px_30px_-12px_rgba(11,25,44,0.5)]"
          >
            <Plus className="w-4 h-4" />
            הוסף לקוח חדש
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-black/5 flex items-center justify-center mb-4 shadow-sm">
              <Users className="w-7 h-7 text-[#0B192C]/40" strokeWidth={1.5} />
            </div>
            <div className="text-lg font-medium text-[#0B192C]">
              אין לקוחות עדיין
            </div>
            <div className="text-sm text-black/50 mt-1">
              הוסף לקוח ראשון כדי להתחיל
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative bg-white rounded-3xl p-6 border border-black/5 shadow-[0_4px_20px_-8px_rgba(11,25,44,0.1)] hover:shadow-[0_20px_50px_-20px_rgba(11,25,44,0.25)] hover:-translate-y-0.5 transition-all"
              >
                {/* Actions */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openClientDialogFor(c.id)}
                    className="w-8 h-8 rounded-xl bg-white border border-black/5 shadow-sm flex items-center justify-center text-[#0B192C]/70 hover:text-[#1E67FF] hover:border-[#1E67FF]/30 transition"
                    aria-label="ערוך"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={() => setPendingDelete(c)}
                    className="w-8 h-8 rounded-xl bg-white border border-black/5 shadow-sm flex items-center justify-center text-[#0B192C]/70 hover:text-[#FF3B30] hover:border-[#FF3B30]/30 transition"
                    aria-label="מחק"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-semibold text-lg shrink-0 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${c.brandColors[0] ?? "#0B192C"}, ${c.brandColors[1] ?? "#1E67FF"})`,
                    }}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-[#0B192C] truncate">
                      {c.name}
                    </div>
                    <div className="text-xs text-[#1E67FF] font-medium mt-0.5">
                      {c.industry}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-black/60 mt-4 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                  {c.targetAudience || "—"}
                </p>

                <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-black/5">
                  <span className="text-[11px] text-black/40 ml-auto">
                    צבעי מותג
                  </span>
                  {c.brandColors.map((col) => (
                    <div
                      key={col}
                      className="w-5 h-5 rounded-md border border-black/10"
                      style={{ backgroundColor: col }}
                      title={col}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent
          dir="rtl"
          className="rounded-3xl border-black/5 p-8 bg-white shadow-[0_30px_80px_-30px_rgba(11,25,44,0.4)] max-w-md"
        >
          <AlertDialogHeader className="text-right space-y-2">
            <AlertDialogTitle className="text-xl font-semibold text-[#0B192C] tracking-tight text-right">
              למחוק את הלקוח?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-black/55 text-right leading-relaxed">
              הלקוח{" "}
              <span className="font-semibold text-[#0B192C]">
                {pendingDelete?.name}
              </span>{" "}
              יימחק לצמיתות מהמערכת. פעולה זו אינה הפיכה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:justify-start flex-row-reverse">
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteClient(pendingDelete.id);
                setPendingDelete(null);
              }}
              className="h-11 rounded-2xl bg-[#FF3B30] text-white text-sm font-medium hover:bg-[#FF3B30]/90 shadow-[0_10px_25px_-10px_rgba(255,59,48,0.5)]"
            >
              מחק לקוח
            </AlertDialogAction>
            <AlertDialogCancel className="h-11 mt-0 rounded-2xl bg-black/5 text-[#0B192C] text-sm font-medium hover:bg-black/10 border-0">
              ביטול
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
