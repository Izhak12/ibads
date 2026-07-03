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
          <GraphicCanvas ref={captureRef} item={item} accentColor={accentColor} index={index} />
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

// ---- Layout template engine ----

type TemplateId = "horizontal" | "vertical" | "framed";
type Palette = { bg: string; fg: string; muted: string; cta: string; ctaFg: string };

function pickTemplate(index: number, _accentColor: string): { template: TemplateId; palette: Palette } {
  const templates: TemplateId[] = ["horizontal", "vertical", "framed"];
  const template = templates[index % templates.length];

  const palettes: Palette[] = [
    // Deep Navy — light text, sand/gold CTA
    { bg: "#0F1F38", fg: "#F9F6F0", muted: "#B8C2D1", cta: "#D9C48E", ctaFg: "#0F1F38" },
    // Soft Cream — dark text, navy CTA
    { bg: "#F9F6F0", fg: "#0F1F38", muted: "#4A5A73", cta: "#0F1F38", ctaFg: "#F9F6F0" },
    // Sage Green — light text, navy CTA
    { bg: "#8DA399", fg: "#F9F6F0", muted: "#EDEDE0", cta: "#0F1F38", ctaFg: "#F9F6F0" },
  ];
  const palette = palettes[index % palettes.length];
  return { template, palette };
}

const FONT_FAMILY = '"Heebo", system-ui, sans-serif';

const GraphicCanvas = forwardRef<
  HTMLDivElement,
  { item: GraphicItem; accentColor: string; index: number }
>(function GraphicCanvas({ item, accentColor, index }, ref) {
  const { template, palette } = pickTemplate(index, accentColor);

  return (
    <div
      ref={ref}
      dir="rtl"
      style={{
        width: RENDER_SIZE,
        height: RENDER_SIZE,
        position: "relative",
        overflow: "hidden",
        backgroundColor: palette.bg,
        fontFamily: FONT_FAMILY,
      }}
    >
      {template === "horizontal" && <HorizontalSplit item={item} palette={palette} />}
      {template === "vertical" && <VerticalSplit item={item} palette={palette} />}
      {template === "framed" && <FramedCard item={item} palette={palette} />}
    </div>
  );
});

function TextBlock({
  item,
  palette,
  headlineSize = 84,
  subheadlineSize = 30,
  ctaSize = 26,
}: {
  item: GraphicItem;
  palette: Palette;
  headlineSize?: number;
  subheadlineSize?: number;
  ctaSize?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        alignItems: "flex-end",
        textAlign: "right",
        direction: "rtl",
        width: "100%",
        color: palette.fg,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          fontSize: headlineSize,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          width: "100%",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          color: palette.fg,
          fontFamily: FONT_FAMILY,
        }}
      >
        {item.headline}
      </div>
      {item.subheadline && (
        <div
          style={{
            fontSize: subheadlineSize,
            fontWeight: 400,
            lineHeight: 1.4,
            width: "100%",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            color: palette.muted,
            fontFamily: FONT_FAMILY,
          }}
        >
          {item.subheadline}
        </div>
      )}
      {item.cta && (
        <div
          style={{
            marginTop: 20,
            padding: "18px 40px",
            borderRadius: 4,
            background: palette.cta,
            color: palette.ctaFg,
            fontSize: ctaSize,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            boxShadow: "0 6px 20px rgba(15,31,56,0.18)",
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            alignSelf: "flex-end",
            fontFamily: FONT_FAMILY,
          }}
        >
          {item.cta}
        </div>
      )}
    </div>
  );
}

function Photo({ url, style }: { url: string; style: React.CSSProperties }) {
  if (!url) {
    return <div style={{ ...style, background: "#0F1F38" }} />;
  }
  return (
    <img
      src={url}
      crossOrigin="anonymous"
      alt=""
      style={{ ...style, objectFit: "cover" }}
    />
  );
}

// Template A: photo top 55%, solid color bottom 45%
function HorizontalSplit({ item, palette }: { item: GraphicItem; palette: Palette }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Photo url={item.backgroundUrl} style={{ width: "100%", height: "55%", display: "block" }} />
      <div
        style={{
          width: "100%",
          height: "45%",
          background: palette.bg,
          padding: "80px 88px 88px",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <TextBlock item={item} palette={palette} headlineSize={84} subheadlineSize={30} ctaSize={28} />
      </div>
    </div>
  );
}

// Template B: photo right 50%, solid color left 50% (RTL)
function VerticalSplit({ item, palette }: { item: GraphicItem; palette: Palette }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "row" }}>
      <div
        style={{
          width: "50%",
          height: "100%",
          background: palette.bg,
          padding: "88px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <TextBlock item={item} palette={palette} headlineSize={72} subheadlineSize={26} ctaSize={24} />
      </div>
      <Photo url={item.backgroundUrl} style={{ width: "50%", height: "100%" }} />
    </div>
  );
}

// Template C: solid bg, framed photo top, text below (right-aligned)
function FramedCard({ item, palette }: { item: GraphicItem; palette: Palette }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: palette.bg,
        padding: "96px",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "52%",
          borderRadius: 32,
          overflow: "hidden",
          boxShadow: "0 30px 60px -20px rgba(15,31,56,0.35), 0 10px 20px -10px rgba(15,31,56,0.2)",
          flexShrink: 0,
        }}
      >
        <Photo url={item.backgroundUrl} style={{ width: "100%", height: "100%" }} />
      </div>
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingTop: 48,
        }}
      >
        <TextBlock item={item} palette={palette} headlineSize={76} subheadlineSize={28} ctaSize={26} />
      </div>
    </div>
  );
}
    </div>
  );
}

// Template C: solid background, photo card centered top with rounded corners + shadow
function FramedCard({ item, palette }: { item: GraphicItem; palette: Palette }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: palette.bg,
        padding: "72px 72px 64px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "52%",
          borderRadius: 36,
          overflow: "hidden",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.35), 0 10px 20px -10px rgba(0,0,0,0.2)",
          flexShrink: 0,
        }}
      >
        <Photo url={item.backgroundUrl} style={{ width: "100%", height: "100%" }} />
      </div>
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 40,
        }}
      >
        <TextBlock
          item={item}
          palette={palette}
          align="center"
          textAlign="center"
          headlineSize={70}
          subheadlineSize={28}
          ctaSize={26}
        />
      </div>
    </div>
  );
}

