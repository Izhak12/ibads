import { forwardRef, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export type GraphicItem = {
  headline: string;
  subheadline: string;
  cta: string;
  backgroundUrl: string;
};

type Props = {
  item: GraphicItem;
  index: number;
  accentColor?: string;
  fileNameBase?: string;
};

// Fixed logical render size for export fidelity
const RENDER_SIZE = 1080;

export const GraphicCard = forwardRef<HTMLDivElement, Props>(function GraphicCard(
  { item, index, accentColor = "#1E67FF", fileNameBase = "graphic" },
  _forwardedRef,
) {
  const captureRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const node = captureRef.current;
    if (!node) return;
    setDownloading(true);
    try {
      // Ensure webfonts are ready before capture
      if (document.fonts?.ready) await document.fonts.ready;
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1, // node is already 1080px logical
        width: RENDER_SIZE,
        height: RENDER_SIZE,
        backgroundColor: "#000",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileNameBase}-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בהורדת הגרפיקה", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-w-0 min-h-0 rounded-2xl overflow-hidden bg-black shadow-[0_10px_30px_-15px_rgba(11,25,44,0.35)] border border-black/5 group"
      style={{ aspectRatio: "1 / 1" }}
    >
      {/* Scaled wrapper: renders a fixed 1080x1080 canvas and scales it to fit */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="origin-center"
          style={{
            width: RENDER_SIZE,
            height: RENDER_SIZE,
            transform: "scale(var(--gc-scale, 1))",
          }}
          ref={(el) => {
            if (!el) return;
            // Compute scale so 1080 fits parent width
            const parent = el.parentElement?.parentElement;
            if (!parent) return;
            const resize = () => {
              const w = parent.clientWidth;
              const s = w / RENDER_SIZE;
              el.style.setProperty("--gc-scale", String(s));
            };
            resize();
            const ro = new ResizeObserver(resize);
            ro.observe(parent);
          }}
        >
          <GraphicCanvas ref={captureRef} item={item} accentColor={accentColor} />
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur text-[#0B192C] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-white transition-all disabled:opacity-60"
        aria-label="הורד גרפיקה"
        title="הורד PNG"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    </motion.div>
  );
});

// Actual composited canvas — rendered at a fixed 1080x1080 for pixel-perfect export
const GraphicCanvas = forwardRef<
  HTMLDivElement,
  { item: GraphicItem; accentColor: string }
>(function GraphicCanvas({ item, accentColor }, ref) {
  return (
    <div
      ref={ref}
      dir="rtl"
      style={{
        width: RENDER_SIZE,
        height: RENDER_SIZE,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#000",
        fontFamily: '"Heebo", "Inter", system-ui, sans-serif',
      }}
    >
      {/* Background photo */}
      {item.backgroundUrl ? (
        <img
          src={item.backgroundUrl}
          crossOrigin="anonymous"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${accentColor}, #0B192C)`,
          }}
        />
      )}

      {/* Dark gradient overlay bottom → top */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Text content */}
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          padding: "72px 80px 88px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          alignItems: "flex-start",
          color: "#fff",
          textAlign: "right",
          direction: "rtl",
        }}
      >
        <div
          style={{
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textShadow: "0 2px 24px rgba(0,0,0,0.35)",
            width: "100%",
          }}
        >
          {item.headline}
        </div>
        {item.subheadline && (
          <div
            style={{
              fontSize: 34,
              fontWeight: 400,
              lineHeight: 1.35,
              opacity: 0.92,
              maxWidth: "88%",
              textShadow: "0 1px 12px rgba(0,0,0,0.35)",
            }}
          >
            {item.subheadline}
          </div>
        )}
        {item.cta && (
          <div
            style={{
              marginTop: 12,
              padding: "22px 44px",
              borderRadius: 999,
              background: accentColor,
              color: "#fff",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
            }}
          >
            {item.cta}
          </div>
        )}
      </div>
    </div>
  );
});
