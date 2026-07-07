import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { GeneratingOrb } from "./GeneratingOrb";
import { SuccessGrid } from "./SuccessGrid";
import type { GraphicItem } from "./GraphicCard";

const ease = [0.22, 1, 0.36, 1] as const;

export type PreviewState = "idle" | "loading" | "success";

export function PreviewPanel({
  state,
  items,
  accentColor,
  fileNameBase,
  onReset,
  onGenerateCopy,
}: {
  state: PreviewState;
  items: GraphicItem[];
  accentColor?: string;
  fileNameBase?: string;
  onReset: () => void;
  onGenerateCopy?: (index: number) => void;
}) {
  return (
    <div className="flex-1 h-screen p-8 overflow-hidden">
      <div className="w-full h-full relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          {state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <GeneratingOrb />
            </motion.div>
          )}
          {state === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
              className="absolute inset-0"
            >
              <SuccessGrid
                items={items}
                accentColor={accentColor}
                fileNameBase={fileNameBase}
                onReset={onReset}
                onGenerateCopy={onGenerateCopy}
              />
            </motion.div>
          )}
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease }}
              className="flex flex-col items-center text-center max-w-sm"
            >
              <div className="relative w-56 h-56 mb-8">
                <div className="absolute inset-0 rounded-[2.5rem] bg-white shadow-[0_20px_60px_-20px_rgba(11,25,44,0.15)] rotate-6" />
                <div className="absolute inset-0 rounded-[2.5rem] bg-white shadow-[0_20px_60px_-20px_rgba(11,25,44,0.1)] -rotate-3" />
                <div className="absolute inset-0 rounded-[2.5rem] bg-white flex items-center justify-center shadow-[0_20px_60px_-20px_rgba(11,25,44,0.2)]">
                  <ImageIcon className="w-14 h-14 text-[#0B192C]/25" strokeWidth={1.2} />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-[#0B192C] tracking-tight">
                המסך שלך מחכה ליצירה
              </h2>
              <p className="mt-3 text-sm text-black/50 leading-relaxed">
                מלא את הפרטים בטופס והתחל ליצור גרפיקות מרהיבות בלחיצת כפתור.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
