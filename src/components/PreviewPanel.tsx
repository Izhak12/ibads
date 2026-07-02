import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { GeneratingOrb } from "./GeneratingOrb";

const ease = [0.22, 1, 0.36, 1] as const;

export function PreviewPanel({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div className="flex-1 h-screen flex items-center justify-center p-10 overflow-hidden">
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease }}
          >
            <GeneratingOrb />
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="relative w-56 h-56 mb-8">
              <div className="absolute inset-0 rounded-[2.5rem] bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] rotate-6" />
              <div className="absolute inset-0 rounded-[2.5rem] bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] -rotate-3" />
              <div className="absolute inset-0 rounded-[2.5rem] bg-white flex items-center justify-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.2)]">
                <ImageIcon className="w-14 h-14 text-black/20" strokeWidth={1.2} />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-black tracking-tight">
              המסך שלך מחכה ליצירה
            </h2>
            <p className="mt-3 text-sm text-black/50 leading-relaxed">
              מלא את הפרטים בטופס והתחל ליצור גרפיקות מרהיבות בלחיצת כפתור.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
