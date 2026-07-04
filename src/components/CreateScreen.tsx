import { useState } from "react";
import { motion } from "framer-motion";
import { ImageOff, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppleSlider } from "./AppleSlider";
import { PreviewPanel, type PreviewState } from "./PreviewPanel";
import { useClients } from "@/context/ClientsContext";
import { useClientAssets } from "@/hooks/useClientAssets";
import type { GraphicItem } from "./GraphicCard";

const ease = [0.22, 1, 0.36, 1] as const;

export function CreateScreen() {
  const { clients, selectedClientId, setSelectedClientId, openClientDialog, openClientDialogFor } =
    useClients();
  const [text, setText] = useState("");
  const [brief, setBrief] = useState("");
  const [count, setCount] = useState(3);
  const [preview, setPreview] = useState<PreviewState>("idle");
  const [items, setItems] = useState<GraphicItem[]>([]);

  const client = clients.find((c) => c.id === selectedClientId) ?? null;
  const { assets } = useClientAssets(selectedClientId, "photo");
  const { assets: refs } = useClientAssets(selectedClientId, "reference");
  const accentColor = client?.brandColors?.[1] ?? client?.brandColors?.[0] ?? "#1E67FF";
  const fileNameBase = client?.name?.replace(/\s+/g, "-").toLowerCase() || "graphic";

  const canGenerate = !!client && assets.length > 0 && preview !== "loading";

  const generateOneImage = async (
    concept: { headline: string; subheadline: string; cta: string; designBrief?: string },
    assetUrls: string[],
    referenceUrls: string[],
    clientSnapshot: NonNullable<typeof client>,
    idx: number,
  ) => {
    const runOnce = async () => {
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, status: "loading", error: undefined } : it,
        ),
      );
      try {
        const res = await fetch("/api/generate-ad-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headline: concept.headline,
            subheadline: concept.subheadline,
            cta: concept.cta,
            designBrief: concept.designBrief ?? "",
            clientName: clientSnapshot.name,
            clientIndustry: clientSnapshot.industry,
            targetAudience: clientSnapshot.targetAudience,
            brandVibe: clientSnapshot.brandVibe,
            brandColors: clientSnapshot.brandColors,
            assetUrls,
            referenceUrls,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.b64) throw new Error(data?.error ?? "שגיאה ביצירת התמונה");
        setItems((prev) =>
          prev.map((it, i) =>
            i === idx ? { ...it, status: "success", imageB64: data.b64 } : it,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "שגיאה ביצירת התמונה";
        setItems((prev) =>
          prev.map((it, i) =>
            i === idx
              ? { ...it, status: "error", error: message, retry: runOnce }
              : it,
          ),
        );
      }
    };
    await runOnce();
  };

  const handleGenerate = async () => {
    if (!client) {
      toast.error("בחר לקוח לפני יצירת גרפיקות");
      return;
    }
    if (assets.length === 0) {
      toast.error("אין תמונות ללקוח", {
        description: "העלה תמונות עסק במסך עריכת הלקוח לפני יצירת גרפיקות.",
      });
      return;
    }
    setPreview("loading");
    setItems([]);
    try {
      const res = await fetch("/api/generate-graphics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: client.name,
          clientIndustry: client.industry,
          targetAudience: client.targetAudience,
          brandVibe: client.brandVibe,
          brandColors: client.brandColors,
          text,
          brief: [client.brief, brief].filter(Boolean).join("\n\n"),
          amount: count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "שגיאה");
      const texts = data.items as Array<{
        headline: string;
        subheadline: string;
        cta: string;
        designBrief?: string;
      }>;

      const perItemAssets: string[][] = texts.map((_, i) => {
        const out: string[] = [];
        const n = Math.min(3, assets.length);
        for (let k = 0; k < n; k++) out.push(assets[(i + k) % assets.length].url);
        return out;
      });

      const seeded: GraphicItem[] = texts.map((t) => ({
        headline: t.headline,
        subheadline: t.subheadline,
        cta: t.cta,
        designBrief: t.designBrief,
        status: "loading",
      }));
      setItems(seeded);
      setPreview("success");

      const referenceUrls = refs.slice(0, 3).map((r) => r.url);

      const clientSnapshot = client;
      void Promise.all(
        texts.map((t, i) => generateOneImage(t, perItemAssets[i], referenceUrls, clientSnapshot, i)),
      );
    } catch (err) {
      console.error(err);
      toast.error("שגיאה ביצירת הגרפיקות", {
        description: err instanceof Error ? err.message : undefined,
      });
      setPreview("idle");
    }
  };

  return (
    <>
      <div className="w-[440px] shrink-0 h-screen bg-white border-l border-black/5 overflow-y-auto">
        <div className="p-10">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease }}
            className="flex flex-col gap-7"
          >
            <div>
              <h1 className="text-2xl font-semibold text-[#0B192C] tracking-tight">
                יצירת גרפיקה
              </h1>
              <p className="text-sm text-black/50 mt-1">
                ספר לנו על הפרויקט ונדאג לשאר
              </p>
            </div>

            {/* Client */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#0B192C]/80">בחר לקוח</label>
              <Select
                value={selectedClientId ?? undefined}
                onValueChange={setSelectedClientId}
                dir="rtl"
              >
                <SelectTrigger className="h-12 rounded-2xl bg-black/[0.03] border border-black/5 px-4 text-sm shadow-none focus:ring-4 focus:ring-[#1E67FF]/10 focus:border-[#1E67FF]/40 data-[state=open]:bg-white">
                  <SelectValue placeholder="בחר לקוח מהרשימה" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-black/5 shadow-lg">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-lg">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={openClientDialog}
                className="flex items-center gap-1 text-xs text-[#1E67FF] hover:text-[#0B192C] transition-colors self-start mt-1 font-medium"
              >
                <Plus className="w-3 h-3" />
                צור לקוח חדש
              </button>

              {/* Assets summary */}
              {client && (
                <div className="mt-3 rounded-2xl border border-black/5 bg-black/[0.02] p-3 flex flex-col gap-2">
                  {assets.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-black/60">
                      <ImageOff className="w-4 h-4" />
                      <span>אין תמונות עסק.</span>
                      <button
                        onClick={() => openClientDialogFor(client.id)}
                        className="text-[#1E67FF] font-medium hover:underline"
                      >
                        העלה תמונות
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-black/60">
                        {assets.length} תמונות עסק
                      </div>
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        {assets.slice(0, 4).map((a) => (
                          <img
                            key={a.id}
                            src={a.url}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover border border-white shadow-sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-black/5 pt-2">
                    <div className="text-xs text-black/60">
                      {refs.length > 0
                        ? `${refs.length} דוגמאות סטייל`
                        : "ללא דוגמאות סטייל"}
                      {refs.length === 0 && (
                        <>
                          {" · "}
                          <button
                            onClick={() => openClientDialogFor(client.id)}
                            className="text-[#1E67FF] font-medium hover:underline"
                          >
                            הוסף
                          </button>
                        </>
                      )}
                    </div>
                    {refs.length > 0 && (
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        {refs.slice(0, 4).map((a) => (
                          <img
                            key={a.id}
                            src={a.url}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover border border-white shadow-sm"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#0B192C]/80">
                טקסט על הגרפיקה{" "}
                <span className="text-black/40 font-normal">(אופציונלי)</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="הטקסט שיופיע על העיצוב..."
                rows={2}
                className={taCls}
              />
            </div>

            {/* Brief */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#0B192C]/80">
                בריף לגרפיקה{" "}
                <span className="text-black/40 font-normal">(אופציונלי)</span>
              </label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="תאר סגנון, צבעים, אווירה, קהל יעד..."
                rows={4}
                className={taCls}
              />
            </div>

            {/* Slider */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#0B192C]/80">כמות גרפיקות</label>
                <div className="text-2xl font-semibold text-[#0B192C] tabular-nums tracking-tight">
                  {count}
                </div>
              </div>
              <AppleSlider value={count} onValueChange={setCount} min={1} max={10} />
              <div className="flex justify-between text-[11px] text-black/40 tabular-nums">
                <span>1</span>
                <span>10</span>
              </div>
              <div className="text-[11px] text-black/50 leading-relaxed" dir="rtl">
                יצירת כל תמונה יכולה לקחת עד דקה — התמונות מופיעות בהדרגה במסך התצוגה.
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="mt-2 h-14 rounded-2xl bg-[#0B192C] text-white text-sm font-medium hover:bg-[#0B192C]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_15px_35px_-12px_rgba(11,25,44,0.5)] hover:shadow-[0_15px_35px_-8px_rgba(30,103,255,0.4)] disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {preview === "loading" ? "יוצר..." : "צור גרפיקות"}
            </button>
          </motion.div>
        </div>
      </div>

      <PreviewPanel
        state={preview}
        items={items}
        accentColor={accentColor}
        fileNameBase={fileNameBase}
        onReset={() => setPreview("idle")}
      />
    </>
  );
}

const taCls =
  "w-full px-4 py-3 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-[#0B192C] placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-[#1E67FF]/40 focus:ring-4 focus:ring-[#1E67FF]/10 transition-all resize-none";
