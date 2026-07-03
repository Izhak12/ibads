import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClients } from "@/context/ClientsContext";
import { useClientAssets, type ClientAsset } from "@/hooks/useClientAssets";


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
  const {
    clientDialogOpen,
    setClientDialogOpen,
    addClient,
    updateClient,
    clients,
    editingClientId,
  } = useClients();

  const editing = editingClientId
    ? clients.find((c) => c.id === editingClientId) ?? null
    : null;

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [vibe, setVibe] = useState("");
  const [offers, setOffers] = useState("");
  const [colors, setColors] = useState<string[]>(["#0B192C", "#1E67FF"]);
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);

  // Sync when dialog opens / editing target changes
  useEffect(() => {
    if (!clientDialogOpen) return;
    if (editing) {
      setName(editing.name);
      setIndustry(editing.industry);
      setAudience(editing.targetAudience);
      setVibe(editing.brandVibe);
      setOffers(editing.coreOffers);
      setColors(editing.brandColors.length ? editing.brandColors : ["#0B192C", "#1E67FF"]);
      setBrief(editing.brief);
    } else {
      setName("");
      setIndustry("");
      setAudience("");
      setVibe("");
      setOffers("");
      setColors(["#0B192C", "#1E67FF"]);
      setBrief("");
    }
    setGenerating(false);
  }, [clientDialogOpen, editing]);

  const toggleColor = (c: string) => {
    setColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const canGenerate = name.trim().length > 0 && industry.trim().length > 0 && !generating;

  const handleGenerateBrief = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          industry: industry.trim(),
          targetAudience: audience.trim(),
          brandVibe: vibe.trim(),
          coreOffers: offers.trim(),
          brandColors: colors,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "שגיאה");
      setBrief(data.brief ?? "");
      toast.success("האפיון החכם מוכן");
    } catch (err) {
      toast.error("שגיאה ביצירת האפיון", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      industry: industry.trim(),
      targetAudience: audience.trim(),
      brandVibe: vibe.trim(),
      coreOffers: offers.trim(),
      brandColors: colors,
      brief: brief.trim(),
    };
    try {
      if (editing) {
        await updateClient(editing.id, payload);
        toast.success("הלקוח עודכן");
      } else {
        const created = await addClient(payload);
        onCreated?.(created.id);
        toast.success("הלקוח נוסף");
      }
      setClientDialogOpen(false);
    } catch (err) {
      toast.error("שגיאה בשמירת הלקוח", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };


  return (
    <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
      <DialogContent
        dir="rtl"
        className="max-w-2xl rounded-3xl border-black/5 p-0 bg-white shadow-[0_30px_80px_-30px_rgba(11,25,44,0.4)] [&>button]:hidden max-h-[88vh] overflow-hidden flex flex-col"
      >
        <button
          onClick={() => setClientDialogOpen(false)}
          className="absolute left-5 top-5 w-8 h-8 rounded-full flex items-center justify-center text-black/50 hover:bg-black/5 transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto flex-1 px-8 pt-8 pb-6">
          <DialogHeader className="text-right space-y-1">
            <DialogTitle className="text-2xl font-semibold text-[#0B192C] tracking-tight text-right">
              {editing ? "עריכת לקוח" : "לקוח חדש"}
            </DialogTitle>
            <DialogDescription className="text-sm text-black/50 text-right">
              ענה על מספר שאלות ואנחנו נבנה עבורך אפיון קריאייטיבי מלא
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 mt-6">
            {/* Business */}
            <Section title="פרטי עסק">
              <div className="grid grid-cols-2 gap-3">
                <Field label="שם העסק">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="לדוגמה: קפה שקד"
                    className={inputCls}
                  />
                </Field>
                <Field label="תחום / נישה">
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="בתי קפה, אופנה, טכנולוגיה"
                    className={inputCls}
                  />
                </Field>
              </div>
            </Section>

            {/* Audience */}
            <Section title="קהל יעד">
              <Field label="גיל, תחומי עניין, כאבים">
                <textarea
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="לדוגמה: נשים 25-40, אמהות עובדות, מחפשות פתרונות מהירים ואיכותיים"
                  rows={2}
                  className={`${inputCls} py-3 resize-none h-auto`}
                />
              </Field>
            </Section>

            {/* Brand identity */}
            <Section title="זהות מותג">
              <div className="flex flex-col gap-4">
                <Field label="ווייב / טון דיבור">
                  <textarea
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    placeholder="חמים ואנושי, מקצועי ונחוש, מינימליסטי ורגוע..."
                    rows={2}
                    className={`${inputCls} py-3 resize-none h-auto`}
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
                                  c === "#F5F5F7" || c === "#D7A86E"
                                    ? "#0B192C"
                                    : "#fff",
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </Section>

            {/* Offers */}
            <Section title="מוצרים / הצעות ליבה">
              <Field label="מה בדיוק העסק מוכר">
                <textarea
                  value={offers}
                  onChange={(e) => setOffers(e.target.value)}
                  placeholder="קפה מיוחד, מאפים ביתיים, סדנאות ברייסטה..."
                  rows={2}
                  className={`${inputCls} py-3 resize-none h-auto`}
                />
              </Field>
            </Section>

            {/* Business assets */}
            <Section title="נכסים דיגיטליים (תמונות העסק)">
              <AssetsUploader clientId={editingClientId} />
            </Section>

            {/* AI Brief */}

            <Section title="אפיון קריאייטיבי חכם">
              <button
                onClick={handleGenerateBrief}
                disabled={!canGenerate}
                className="group relative h-12 w-full rounded-2xl text-white text-sm font-medium overflow-hidden transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99] shadow-[0_15px_35px_-12px_rgba(30,103,255,0.5)]"
                style={{
                  background:
                    "linear-gradient(120deg, #1E67FF 0%, #7B3FE4 50%, #0B192C 100%)",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      יוצר אפיון…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      ✨ צור אפיון חכם
                    </>
                  )}
                </span>
              </button>

              <div className="relative mt-3">
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="האפיון שייווצר יופיע כאן וניתן יהיה לערוך אותו לפני השמירה…"
                  rows={10}
                  className={`${inputCls} py-4 resize-none h-auto leading-relaxed text-[13px] whitespace-pre-wrap`}
                />
                {generating && <BriefLoadingOverlay />}
              </div>
            </Section>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-black/5 bg-white/80 backdrop-blur px-8 py-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={!name.trim() || generating}
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

function BriefLoadingOverlay() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      {/* Rotating conic gradient border */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-90"
        style={{
          background:
            "conic-gradient(from 0deg, #1E67FF, #AF52DE, #FF3B30, #F5A623, #1E67FF)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: 2,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, ease: "linear", repeat: Infinity }}
      />
      {/* Soft frosted backdrop */}
      <div className="absolute inset-0 rounded-2xl bg-white/70 backdrop-blur-md" />
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <motion.div
          className="flex items-center gap-1.5"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
        >
          <Sparkles className="w-4 h-4 text-[#1E67FF]" />
          <span className="text-sm font-medium text-[#0B192C]">
            כותב אפיון חכם
          </span>
        </motion.div>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#1E67FF]"
              animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-12 px-4 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-[#0B192C] placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-[#1E67FF]/40 focus:ring-4 focus:ring-[#1E67FF]/10 transition-all";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#0B192C]/70">{label}</label>
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] uppercase tracking-widest text-[#1E67FF] font-semibold">
        {title}
      </div>
      {children}
    </div>
  );
}

const MAX_FILE_MB = 10;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

function AssetsUploader({ clientId }: { clientId: string | null }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { assets, isLoading, uploading, uploadFiles, deleteAsset } =
    useClientAssets(clientId);
  const [dragOver, setDragOver] = useState(false);

  if (!clientId) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] p-5 text-center text-xs text-black/50">
        שמור את הלקוח תחילה כדי להעלות תמונות עסק.
      </div>
    );
  }

  const handleFiles = async (files: File[]) => {
    const valid: File[] = [];
    for (const f of files) {
      if (!ACCEPT.includes(f.type)) {
        toast.error(`${f.name}: פורמט לא נתמך`);
        continue;
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${f.name}: הקובץ גדול מ-${MAX_FILE_MB}MB`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;
    try {
      await uploadFiles(valid);
      toast.success(`${valid.length} תמונות הועלו`);
    } catch (err) {
      toast.error("שגיאה בהעלאה", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleDelete = async (a: ClientAsset) => {
    try {
      await deleteAsset(a);
    } catch (err) {
      toast.error("שגיאה במחיקה", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length) handleFiles(files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-[#1E67FF] bg-[#1E67FF]/5"
            : "border-black/10 bg-black/[0.02] hover:bg-black/[0.04]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) handleFiles(files);
            e.currentTarget.value = "";
          }}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1E67FF]" />
            ) : (
              <Upload className="w-4 h-4 text-[#1E67FF]" />
            )}
          </div>
          <div className="text-sm font-medium text-[#0B192C]">
            {uploading ? "מעלה תמונות..." : "גרור לכאן תמונות או לחץ להעלאה"}
          </div>
          <div className="text-[11px] text-black/40">
            JPG / PNG / WebP · עד {MAX_FILE_MB}MB לתמונה
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-black/40 text-center py-2">טוען תמונות...</div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {assets.map((a) => (
            <div
              key={a.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-black/5 group border border-black/5"
            >
              <img src={a.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(a)}
                className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-white/95 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                aria-label="מחק"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-black/40 text-center py-2">
          עדיין לא הועלו תמונות
        </div>
      )}
    </div>
  );
}

