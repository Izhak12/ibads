import { motion } from "framer-motion";

export function GeneratingOrb() {
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full blur-3xl opacity-70"
          style={{
            background:
              "conic-gradient(from 0deg, #a78bfa, #f472b6, #60a5fa, #22d3ee, #a78bfa)",
          }}
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        {/* mid orb */}
        <motion.div
          className="absolute w-48 h-48 rounded-full"
          style={{
            background:
              "conic-gradient(from 90deg, #c4b5fd, #f9a8d4, #93c5fd, #67e8f9, #c4b5fd)",
            filter: "blur(6px)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        {/* inner core */}
        <motion.div
          className="relative w-40 h-40 rounded-full bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[inset_0_1px_20px_rgba(255,255,255,0.6)]"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* highlight */}
        <motion.div
          className="absolute top-8 left-14 w-10 h-10 rounded-full bg-white/70 blur-md"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-xl font-medium text-black tracking-tight">
          יוצר קסמים...
        </div>
        <div className="text-sm text-black/50 mt-2">
          זה עשוי לקחת רגע
        </div>
      </motion.div>
    </div>
  );
}
