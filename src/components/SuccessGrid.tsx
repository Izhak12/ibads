import { motion } from "framer-motion";

function layoutFor(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 9) return { cols: 3, rows: 3 };
  return { cols: 4, rows: 3 };
}

export function SuccessGrid({
  images,
  onReset,
}: {
  images: string[];
  onReset: () => void;
}) {
  const count = images.length;
  const { cols, rows } = layoutFor(count);

  return (
    <div className="w-full h-full flex flex-col gap-4 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="text-xl font-semibold text-[#0B192C] tracking-tight">
            הגרפיקות מוכנות
          </div>
          <div className="text-sm text-black/50 mt-0.5">
            {count} עיצובים נוצרו עבורך
          </div>
        </div>
        <button
          onClick={onReset}
          className="px-4 h-10 rounded-xl text-sm font-medium text-[#0B192C] bg-white border border-black/10 hover:bg-black/5 transition-colors"
        >
          צור שוב
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div
          className="grid gap-3 h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            aspectRatio: `${cols} / ${rows}`,
            maxHeight: "100%",
            maxWidth: "100%",
            margin: "0 auto",
          }}
        >
          {images.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: i * 0.07,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative min-w-0 min-h-0 rounded-2xl overflow-hidden bg-white shadow-[0_10px_30px_-15px_rgba(11,25,44,0.25)] border border-black/5"
            >
              <img
                src={src}
                alt={`גרפיקה ${i + 1}`}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
