import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppleSlider } from "./AppleSlider";
import { NewClientForm } from "./NewClientForm";

const ease = [0.22, 1, 0.36, 1] as const;

export function CreateForm({ onGenerate }: { onGenerate: () => void }) {
  const [view, setView] = useState<"graphic" | "new-client">("graphic");
  const [clients, setClients] = useState<string[]>([
    "קפה שקד",
    "סטודיו נועה",
    "אורבן פיטנס",
  ]);
  const [client, setClient] = useState<string>("");
  const [text, setText] = useState("");
  const [brief, setBrief] = useState("");
  const [count, setCount] = useState(3);

  return (
    <div className="w-[440px] shrink-0 h-screen bg-white border-l border-black/5 overflow-y-auto">
      <div className="p-10">
        <AnimatePresence mode="wait">
          {view === "graphic" ? (
            <motion.div
              key="graphic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35, ease }}
              className="flex flex-col gap-7"
            >
              <div>
                <h1 className="text-2xl font-semibold text-black tracking-tight">
                  יצירת גרפיקה
                </h1>
                <p className="text-sm text-black/50 mt-1">
                  ספר לנו על הפרויקט ונדאג לשאר
                </p>
              </div>

              {/* Client */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black/80">
                  בחר לקוח
                </label>
                <Select value={client} onValueChange={setClient} dir="rtl">
                  <SelectTrigger className="h-12 rounded-2xl bg-black/[0.03] border border-black/5 px-4 text-sm shadow-none focus:ring-4 focus:ring-black/5 focus:border-black/20 data-[state=open]:bg-white">
                    <SelectValue placeholder="בחר לקוח מהרשימה" />
                    <ChevronDown className="w-4 h-4 opacity-40" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-black/5 shadow-lg">
                    {clients.map((c) => (
                      <SelectItem key={c} value={c} className="rounded-lg">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => setView("new-client")}
                  className="flex items-center gap-1 text-xs text-black/50 hover:text-black transition-colors self-start mt-1"
                >
                  <Plus className="w-3 h-3" />
                  צור לקוח חדש
                </button>
              </div>

              {/* Text */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black/80">
                  טקסט על הגרפיקה{" "}
                  <span className="text-black/40 font-normal">(אופציונלי)</span>
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="הטקסט שיופיע על העיצוב..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-black/20 focus:ring-4 focus:ring-black/5 transition-all resize-none"
                />
              </div>

              {/* Brief */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black/80">
                  בריף לגרפיקה{" "}
                  <span className="text-black/40 font-normal">(אופציונלי)</span>
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="תאר סגנון, צבעים, אווירה, קהל יעד..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-black/20 focus:ring-4 focus:ring-black/5 transition-all resize-none"
                />
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-black/80">
                    כמות גרפיקות
                  </label>
                  <div className="text-2xl font-semibold text-black tabular-nums tracking-tight">
                    {count}
                  </div>
                </div>
                <AppleSlider value={count} onValueChange={setCount} min={1} max={10} />
                <div className="flex justify-between text-[11px] text-black/40 tabular-nums">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={onGenerate}
                className="mt-2 h-14 rounded-2xl bg-black text-white text-sm font-medium hover:bg-black/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]"
              >
                <Sparkles className="w-4 h-4" />
                צור גרפיקות
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="new-client"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease }}
            >
              <NewClientForm
                onCancel={() => setView("graphic")}
                onSave={(name) => {
                  setClients((prev) => [name, ...prev]);
                  setClient(name);
                  setView("graphic");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
