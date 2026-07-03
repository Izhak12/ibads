import { forwardRef, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Diamond, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export type GraphicItem = {
  headline: string;
  subheadline: string;
  cta: string;
  backgroundUrl: string;
  photos?: string[];
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
      if (document.fonts?.ready) await document.fonts.ready;
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1,
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

// ---- Templates ----

type TemplateId = "split" | "polaroid" | "card";
type Palette = { bg: string; fg: string; muted: string; cta: string; ctaFg: string; accent: string };

const PALETTES: Palette[] = [
  // Navy + gold
  { bg: "#0F1F38", fg: "#F5F1EA", muted: "rgba(245,241,234,0.75)", cta: "#D4AF7A", ctaFg: "#0F1F38", accent: "#D4AF7A" },
  // Cream + navy
  { bg: "#F2ECE1", fg: "#0F1F38", muted: "rgba(15,31,56,0.65)", cta: "#0F1F38", ctaFg: "#F9F6F0", accent: "#0F1F38" },
  // Sage + cream
  { bg: "#8DA399", fg: "#F9F6F0", muted: "rgba(249,246,240,0.8)", cta: "#0F1F38", ctaFg: "#F9F6F0", accent: "#F9F6F0" },
];

function pickTemplate(index: number): TemplateId {
  return (["split", "polaroid", "card"] as TemplateId[])[index % 3];
}
function pickPalette(index: number): Palette {
  return PALETTES[index % PALETTES.length];
}

const HEEBO = '"Heebo", system-ui, sans-serif';
const RUBIK = '"Rubik", system-ui, sans-serif';

function getPhotos(item: GraphicItem): string[] {
  const list = (item.photos && item.photos.length > 0 ? item.photos : [item.backgroundUrl]).filter(
    Boolean,
  ) as string[];
  return list.length ? list : [""];
}

function headlineFontSize(text: string, base = 92): number {
  const len = (text || "").length;
  if (len <= 14) return base + 12;
  if (len <= 22) return base;
  if (len <= 34) return Math.round(base * 0.82);
  if (len <= 50) return Math.round(base * 0.66);
  return Math.round(base * 0.54);
}

const GraphicCanvas = forwardRef<
  HTMLDivElement,
  { item: GraphicItem; accentColor: string; index: number }
>(function GraphicCanvas({ item, index }, ref) {
  const template = pickTemplate(index);
  const palette = pickPalette(index);
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
        boxSizing: "border-box",
      }}
    >
      {template === "split" && <SplitLayout item={item} palette={palette} />}
      {template === "polaroid" && <PolaroidCollage item={item} />}
      {template === "card" && <PremiumCard item={item} palette={palette} />}
    </div>
  );
});

// ---------- Template A: Split Layout ----------
function SplitLayout({ item, palette }: { item: GraphicItem; palette: Palette }) {
  const [hero] = getPhotos(item);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: palette.bg }}>
      {/* Hero photo — top 55% */}
      <div style={{ position: "relative", width: "100%", height: "55%", overflow: "hidden", flexShrink: 0 }}>
        {hero ? (
          <img
            src={hero}
            crossOrigin="anonymous"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#111" }} />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0) 60%, ${palette.bg} 100%)`,
          }}
        />
      </div>

      {/* Text region — bottom 45%, natural flow */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: "56px 72px 72px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          direction: "rtl",
          textAlign: "right",
          gap: 20,
        }}
      >
        <div
          style={{
            fontFamily: HEEBO,
            fontWeight: 800,
            fontSize: headlineFontSize(item.headline, 88),
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: palette.fg,
            maxWidth: "100%",
            minWidth: 0,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {item.headline}
        </div>
        <div style={{ height: 1, width: 140, background: palette.accent, opacity: 0.85 }} />
        {item.subheadline && (
          <div
            style={{
              fontFamily: HEEBO,
              fontWeight: 400,
              fontSize: 30,
              lineHeight: 1.4,
              color: palette.muted,
              maxWidth: "100%",
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {item.subheadline}
          </div>
        )}
        {item.cta && (
          <div
            style={{
              marginTop: "auto",
              alignSelf: "flex-end",
              flexShrink: 0,
              fontFamily: HEEBO,
              fontWeight: 700,
              fontSize: 26,
              padding: "18px 44px",
              background: palette.cta,
              color: palette.ctaFg,
              borderRadius: 4,
              letterSpacing: "0.02em",
              boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
              maxWidth: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.cta}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Template B: Polaroid Collage ----------
function PolaroidCollage({ item }: { item: GraphicItem }) {
  const photos = getPhotos(item).slice(0, 3);
  const STAGE_H = 600;
  // Bounded stage keeps rotated polaroids inside canvas
  const presets = [
    { top: 60, left: 90, rot: -6, w: 340 },
    { top: 110, left: 380, rot: 4, w: 360 },
    { top: 40, left: 690, rot: -2, w: 320 },
  ];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 50% 40%, #262421 0%, #141311 55%, #0a0908 100%)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1.5px), radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1.5px)",
          backgroundSize: "6px 6px, 11px 11px",
          backgroundPosition: "0 0, 3px 4px",
          opacity: 0.6,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* Bounded polaroid stage */}
      <div style={{ position: "relative", width: "100%", height: STAGE_H, overflow: "hidden", flexShrink: 0 }}>
        {photos.map((url, i) => {
          const p = presets[i] ?? presets[0];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: p.top,
                left: p.left,
                width: p.w,
                background: "#f5efe4",
                padding: 14,
                paddingBottom: 60,
                boxShadow: "0 40px 70px -20px rgba(0,0,0,0.75), 0 15px 30px -10px rgba(0,0,0,0.55)",
                transform: `rotate(${p.rot}deg)`,
                transformOrigin: "center center",
                zIndex: 10 + i,
              }}
            >
              {url ? (
                <img
                  src={url}
                  crossOrigin="anonymous"
                  alt=""
                  style={{ width: "100%", height: p.w, objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{ width: "100%", height: p.w, background: "#333" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Text region — remaining bottom, safe padding */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: "40px 72px 72px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          direction: "rtl",
          textAlign: "right",
          gap: 20,
          position: "relative",
          zIndex: 30,
        }}
      >
        <div
          style={{
            fontFamily: RUBIK,
            fontWeight: 900,
            fontSize: headlineFontSize(item.headline, 88),
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            backgroundImage: "linear-gradient(135deg,#f6d365 0%,#fda085 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "#fda085",
            maxWidth: "100%",
            minWidth: 0,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {item.headline}
        </div>
        {item.subheadline && (
          <div
            style={{
              fontFamily: HEEBO,
              fontWeight: 400,
              fontSize: 28,
              lineHeight: 1.35,
              color: "rgba(245,239,228,0.85)",
              maxWidth: "100%",
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {item.subheadline}
          </div>
        )}
        {item.cta && (
          <div
            style={{
              marginTop: 4,
              alignSelf: "flex-end",
              flexShrink: 0,
              fontFamily: RUBIK,
              fontWeight: 700,
              fontSize: 26,
              padding: "18px 40px",
              background: "#f5efe4",
              color: "#141311",
              borderRadius: 6,
              boxShadow: "0 12px 28px rgba(0,0,0,0.55), inset 0 -3px 0 rgba(0,0,0,0.12)",
              transform: "rotate(-1.5deg)",
              maxWidth: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "0.01em",
            }}
          >
            {item.cta}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Template C: Premium Centered Card ----------
function PremiumCard({ item, palette }: { item: GraphicItem; palette: Palette }) {
  const [hero] = getPhotos(item);
  const cardBg = palette.bg === "#F2ECE1" ? "rgba(255,249,240,0.97)" : "rgba(249,246,240,0.97)";
  const textColor = "#0F1F38";
  const mutedColor = "rgba(15,31,56,0.7)";
  const accent = "#0F1F38";
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0F1F38", overflow: "hidden" }}>
      {/* Full-bleed hero */}
      {hero ? (
        <img
          src={hero}
          crossOrigin="anonymous"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,31,56,0.35)" }} />

      {/* Centered card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 72,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "82%",
            maxWidth: 820,
            background: cardBg,
            borderRadius: 24,
            padding: "56px 52px",
            boxSizing: "border-box",
            boxShadow: "0 40px 80px -20px rgba(15,31,56,0.5), 0 15px 40px -15px rgba(15,31,56,0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            direction: "rtl",
            textAlign: "right",
            gap: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, alignSelf: "flex-end" }}>
            <Diamond size={22} color={accent} strokeWidth={1.8} />
            <div style={{ width: 48, height: 3, background: accent, borderRadius: 2 }} />
          </div>
          <div
            style={{
              fontFamily: HEEBO,
              fontWeight: 800,
              fontSize: headlineFontSize(item.headline, 76),
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: textColor,
              maxWidth: "100%",
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {item.headline}
          </div>
          {item.subheadline && (
            <div
              style={{
                fontFamily: HEEBO,
                fontWeight: 400,
                fontSize: 26,
                lineHeight: 1.45,
                color: mutedColor,
                maxWidth: "100%",
                minWidth: 0,
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {item.subheadline}
            </div>
          )}
          {item.cta && (
            <div
              style={{
                marginTop: 8,
                alignSelf: "flex-end",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                fontFamily: HEEBO,
                fontWeight: 700,
                fontSize: 24,
                padding: "16px 36px",
                background: accent,
                color: "#F9F6F0",
                borderRadius: 999,
                boxShadow: "0 14px 30px rgba(15,31,56,0.35)",
                maxWidth: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "0.02em",
              }}
            >
              <span>{item.cta}</span>
              <ArrowLeft size={20} strokeWidth={2.5} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
