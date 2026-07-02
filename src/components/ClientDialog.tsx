import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useClients } from "@/context/ClientsContext";
import { Check, X } from "lucide-react";

const presetColors = [
  "#0B192C",
  "#1E67FF",
  "#111111",
  "#F5F5F7",
  "#D7A86E",
  "#3E2723",
  "#FF3B30",
  "#34C759",
  "#AF52DE",
];

export function ClientDialog({
  onCreated,
}: {
  onCreated?: (id: string) => void;
}) {
  const { clientDialogOpen, setClientDialogOpen, addClient } = useClients();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [colors, setColors] = useState<string[]>(["#0B192C", "#1E67FF"]);

  const reset = () => {
    setName("");
    setIndustry("");
    setAudience("");
    setColors(["#0B192C", "#1E67FF"]);
  };

  const toggleColor = (c: string) => {
    setColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const created = addClient({
      name: name.trim(),
      industry: industry.trim(),
      targetAudience: audience.trim(),
      brandColors: colors,
    });
    onCreated?.(created.id);
    reset();
    setClientDialogOpen(false);
  };

  return (
    <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
      <DialogContent
        dir="rtl"
        className="max-w-lg rounded-3xl border-black/5 p-8 bg-white shadow-[0_30px_80px_-30px_rgba(11,25,44,0.4)] [&>button]:hidden"
      >
        <button
          onClick={() => setClientDialogOpen(false)}
          className="absolute left-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-black/50 hover:bg-black/5 transition"
        >
          <X className="w-4 h-4" />
        </button>
        <DialogHeader className="text-right space-y-1">
          <DialogTitle className="text-2xl font-semibold text-[#0B192C] tracking-tight text-right">
            לקוח חדש
          </DialogTitle>
          <DialogDescription className="text-sm text-black/50 text-right">
            הוסף לקוח חדש למאגר שלך
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-4">
          <Field label="שם הלקוח">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: קפה שקד"
              className={inputCls}
            />
          </Field>

          <Field label="תחום">
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="לדוגמה: בתי קפה, אופנה, טכנולוגיה"
              className={inputCls}
            />
          </Field>

          <Field label="קהל יעד">
            <textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="תיאור קצר של קהל היעד"
              rows={2}
              className={`${inputCls} py-3 resize-none`}
            />
          </Field>

          <Field label="צבעי מותג">
            <div className="flex flex-wrap gap-2">
              {presetColors.map((c) => {
                const active = colors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleColor(c)}
                    className={`relative w-9 h-9 rounded-xl border transition ${
                      active
                        ? "border-[#1E67FF] ring-4 ring-[#1E67FF]/15 scale-105"
                        : "border-black/10 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  >
                    {active && (
                      <Check
                        className="absolute inset-0 m-auto w-4 h-4"
                        style={{
                          color:
                            c === "#F5F5F7" || c === "#D7A86E" ? "#0B192C" : "#fff",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 h-12 rounded-2xl bg-[#0B192C] text-white text-sm font-medium hover:bg-[#0B192C]/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-[0_10px_30px_-12px_rgba(11,25,44,0.5)]"
          >
            שמור לקוח
          </button>
          <button
            onClick={() => setClientDialogOpen(false)}
            className="px-6 h-12 rounded-2xl bg-black/5 text-[#0B192C] text-sm font-medium hover:bg-black/10 transition-colors"
          >
            ביטול
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const inputCls =
  "w-full h-12 px-4 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-[#0B192C] placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-[#1E67FF]/40 focus:ring-4 focus:ring-[#1E67FF]/10 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#0B192C]/80">{label}</label>
      {children}
    </div>
  );
}
