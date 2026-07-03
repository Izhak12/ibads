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

type TemplateId = "chalkboard" | "luxury" | "collage";

function pickTemplate(index: number): TemplateId {
  const templates: TemplateId[] = ["chalkboard", "luxury", "collage"];
  return templates[index % templates.length];
}

const HEEBO = '"Heebo", system-ui, sans-serif';
const RUBIK = '"Rubik", system-ui, sans-serif';

function getPhotos(item: GraphicItem): string[] {
  const list = (item.photos && item.photos.length > 0 ? item.photos : [item.backgroundUrl]).filter(
    Boolean,
  ) as string[];
  return list.length ? list : [""];
}

const GraphicCanvas = forwardRef<
  HTMLDivElement,
  { item: GraphicItem; accentColor: string; index: number }
>(function GraphicCanvas({ item, index }, ref) {
  const template = pickTemplate(index);
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
      }}
    >
      {template === "chalkboard" && <ChalkboardMarket item={item} />}
      {template === "luxury" && <LuxuryPremium item={item} />}
      {template === "collage" && <DynamicCollage item={item} />}
    </div>
  );
});

// ---------- Template 1: Chalkboard Market ----------
function ChalkboardMarket({ item }: { item: GraphicItem }) {
  const photos = getPhotos(item).slice(0, 3);
  // Polaroid presets (positions in %, rotations)
  const presets = [
    { top: 90, left: 90, rot: -6, w: 400, h: 400 },
    { top: 140, left: 380, rot: 4, w: 420, h: 420 },
    { top: 60, left: 620, rot: -2, w: 380, h: 380 },
  ];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(circle at 50% 40%, #262421 0%, #141311 55%, #0a0908 100%)",
        overflow: "hidden",
      }}
    >
      {/* chalk texture — subtle repeating specks */}
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
        }}
      />

      {/* Polaroids */}
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
              height: p.h + 70,
              background: "#f5efe4",
              padding: 14,
              paddingBottom: 84,
              boxShadow:
                "0 40px 70px -20px rgba(0,0,0,0.75), 0 15px 30px -10px rgba(0,0,0,0.55)",
              transform: `rotate(${p.rot}deg)`,
              zIndex: 10 + i,
            }}
          >
            {url ? (
              <img
                src={url}
                crossOrigin="anonymous"
                alt=""
                style={{ width: "100%", height: p.h, objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: p.h, background: "#333" }} />
            )}
          </div>
        );
      })}

      {/* Text block anchored bottom-right */}
      <div
        style={{
          position: "absolute",
          right: 96,
          bottom: 96,
          left: 96,
          direction: "rtl",
          textAlign: "right",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: RUBIK,
            fontWeight: 900,
            fontSize: 108,
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            backgroundImage: "linear-gradient(135deg,#f6d365 0%,#fda085 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "#fda085",
            textShadow: "0 4px 20px rgba(0,0,0,0.4)",
            width: "100%",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {item.headline}
        </div>
        {item.subheadline && (
          <div
            style={{
              fontFamily: HEEBO,
              fontWeight: 400,
              fontSize: 34,
              lineHeight: 1.35,
              color: "rgba(245,239,228,0.85)",
              width: "100%",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {item.subheadline}
          </div>
        )}
        {item.cta && (
          <div
            style={{
              fontFamily: RUBIK,
              fontWeight: 700,
              fontSize: 30,
              padding: "20px 44px",
              background: "#f5efe4",
              color: "#141311",
              borderRadius: 6,
              boxShadow:
                "0 12px 28px rgba(0,0,0,0.55), inset 0 -3px 0 rgba(0,0,0,0.12)",
              transform: "rotate(-1.5deg)",
              whiteSpace: "nowrap",
              maxWidth: "100%",
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

// ---------- Template 2: Luxury Premium ----------
function LuxuryPremium({ item }: { item: GraphicItem }) {
  const [hero] = getPhotos(item);
  const GOLD = "#D4AF7A";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg,#0a1f18 0%,#050505 100%)",
      }}
    >
      {/* Hero photo top 60% */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60%" }}>
        {hero ? (
          <img
            src={hero}
            crossOrigin="anonymous"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#0a1f18" }} />
        )}
        {/* Fade overlay into black */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(5,5,5,0.85) 85%, #050505 100%)",
          }}
        />
      </div>

      {/* Text block bottom 40% */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "42%",
          padding: "40px 96px 96px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          direction: "rtl",
          textAlign: "right",
          gap: 24,
          boxSizing: "border-box",
        }}
      >
        <Diamond size={44} color={GOLD} strokeWidth={1.5} />
        <div
          style={{
            fontFamily: HEEBO,
            fontWeight: 800,
            fontSize: 96,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: GOLD,
            width: "100%",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {item.headline}
        </div>
        <div
          style={{
            height: 1,
            width: 160,
            background: GOLD,
            opacity: 0.7,
            marginTop: -6,
          }}
        />
        {item.subheadline && (
          <div
            style={{
              fontFamily: HEEBO,
              fontWeight: 400,
              fontSize: 30,
              lineHeight: 1.4,
              color: "#F5F1EA",
              width: "100%",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {item.subheadline}
          </div>
        )}
        {item.cta && (
          <div
            style={{
              marginTop: 8,
              fontFamily: HEEBO,
              fontWeight: 600,
              fontSize: 26,
              padding: "16px 40px",
              border: `1.5px solid ${GOLD}`,
              color: GOLD,
              borderRadius: 2,
              letterSpacing: "0.06em",
              textTransform: "none",
              whiteSpace: "nowrap",
              maxWidth: "100%",
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

// ---------- Template 3: Dynamic Collage ----------
function DynamicCollage({ item }: { item: GraphicItem }) {
  const photos = getPhotos(item);
  const heroPhoto = photos[0];
  const secondaryPhoto = photos[1] ?? photos[0];
  const ACCENT = "#E86A4E";
  const NAVY = "#0F1F38";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#F2ECE1",
      }}
    >
      {/* Diagonal accent band */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, transparent 55%, ${ACCENT} 55%)`,
          opacity: 0.95,
        }}
      />

      {/* Large hero photo top-right */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 60,
          width: 640,
          height: 620,
          borderRadius: "42% 58% 55% 45% / 52% 45% 55% 48%",
          overflow: "hidden",
          boxShadow: "0 40px 80px -20px rgba(15,31,56,0.55), 0 20px 40px -15px rgba(15,31,56,0.4)",
          zIndex: 10,
        }}
      >
        {heroPhoto ? (
          <img
            src={heroPhoto}
            crossOrigin="anonymous"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: NAVY }} />
        )}
      </div>

      {/* Secondary photo bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 60,
          width: 400,
          height: 400,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 30px 60px -20px rgba(15,31,56,0.55)",
          transform: "rotate(-4deg)",
          zIndex: 12,
          border: "8px solid #F2ECE1",
        }}
      >
        {secondaryPhoto ? (
          <img
            src={secondaryPhoto}
            crossOrigin="anonymous"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: NAVY }} />
        )}
      </div>

      {/* Corner sticker */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: ACCENT,
          color: "#FFF9F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: RUBIK,
          fontWeight: 900,
          fontSize: 22,
          textAlign: "center",
          transform: "rotate(-10deg)",
          boxShadow: "0 12px 30px rgba(15,31,56,0.35)",
          border: "3px solid #FFF9F0",
          zIndex: 20,
          padding: 14,
          boxSizing: "border-box",
          lineHeight: 1.1,
          letterSpacing: "0.02em",
        }}
      >
        חדש
      </div>

      {/* Text block middle-left */}
      <div
        style={{
          position: "absolute",
          right: 60,
          left: 500,
          top: 700,
          bottom: 80,
          direction: "rtl",
          textAlign: "right",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          gap: 22,
          zIndex: 25,
        }}
      >
        <div
          style={{
            fontFamily: HEEBO,
            fontWeight: 800,
            fontSize: 76,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: NAVY,
            width: "100%",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            textShadow: "0 2px 10px rgba(242,236,225,0.9)",
          }}
        >
          {item.headline}
        </div>
        {item.subheadline && (
          <div
            style={{
              fontFamily: HEEBO,
              fontWeight: 500,
              fontSize: 28,
              lineHeight: 1.35,
              color: "#4A5A73",
              width: "100%",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {item.subheadline}
          </div>
        )}
        {item.cta && (
          <div
            style={{
              marginTop: 8,
              fontFamily: RUBIK,
              fontWeight: 700,
              fontSize: 28,
              padding: "20px 40px",
              background: NAVY,
              color: "#FFF9F0",
              borderRadius: 999,
              boxShadow: "0 16px 36px rgba(15,31,56,0.4)",
              transform: "rotate(-3deg)",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              whiteSpace: "nowrap",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "0.01em",
            }}
          >
            <span>{item.cta}</span>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </div>
        )}
      </div>
    </div>
  );
}


