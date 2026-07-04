import { motion } from "framer-motion";
import { AlertCircle, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export type GraphicItem = {
  headline: string;
  subheadline: string;
  cta: string;
  designBrief?: string;
  status: "loading" | "success" | "error";
  imageB64?: string;
  error?: string;
  retry?: () => void;
};

type Props = {
  item: GraphicItem;
  index: number;
  fileNameBase?: string;
};

export function GraphicCard({ item, index, fileNameBase = "graphic" }: Props) {
  const handleDownload = () => {
    if (!item.imageB64) return;
    try {
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${item.imageB64}`;
      a.download = `${fileNameBase}-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast.error("שגיאה בהורדה", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-w-0 min-h-0 rounded-2xl overflow-hidden bg-[#0B192C]/5 shadow-[0_10px_30px_-15px_rgba(11,25,44,0.35)] border border-black/5 group"
      style={{ aspectRatio: "1 / 1" }}
    >
      {item.status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#0B192C]/[0.04] to-[#1E67FF]/[0.06]">
          <div className="absolute inset-0 shimmer" />
          <Loader2 className="w-6 h-6 text-[#0B192C]/50 animate-spin relative z-10" />
          <div className="text-xs text-[#0B192C]/50 relative z-10" dir="rtl">
            מייצר עיצוב…
          </div>
        </div>
      )}

      {item.status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-red-50/70">
          <AlertCircle className="w-7 h-7 text-red-500" />
          <div className="text-xs text-red-700 text-center max-w-[80%]" dir="rtl">
            {item.error || "יצירת התמונה נכשלה"}
          </div>
          {item.retry && (
            <button
              onClick={item.retry}
              className="mt-1 inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
              dir="rtl"
            >
              <RefreshCw className="w-3 h-3" />
              נסה שוב
            </button>
          )}
        </div>
      )}

      {item.status === "success" && item.imageB64 && (
        <>
          <img
            src={`data:image/png;base64,${item.imageB64}`}
            alt={item.headline}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <button
            onClick={handleDownload}
            className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur text-[#0B192C] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-white transition-all"
            aria-label="הורד גרפיקה"
            title="הורד PNG"
          >
            <Download className="w-4 h-4" />
          </button>
        </>
      )}
    </motion.div>
  );
}
