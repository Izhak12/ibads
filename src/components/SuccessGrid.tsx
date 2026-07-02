import { motion } from "framer-motion";

export function SuccessGrid({ count, onReset }: { count: number; onReset: () => void }) {
  const cols = count <= 2 ? 1 : count <= 4 ? 2 : 3;
  return (
    <div className="w-full max-w-3xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
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
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: i * 0.06,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-[0_10px_30px_-15px_rgba(11,25,44,0.25)] border border-black/5"
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(${135 + i * 20}deg, #0B192C 0%, #1E3A5F 45%, #1E67FF 100%)`,
              }}
            />
            <div className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                background:
                  "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), transparent 50%)",
              }}
            />
            <div className="absolute bottom-3 right-3 text-white/90 text-xs font-medium tracking-wide">
              גרפיקה {i + 1}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
