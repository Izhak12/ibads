import { GraphicCard, type GraphicItem } from "./GraphicCard";

function layoutFor(count: number): { cols: number } {
  if (count <= 1) return { cols: 1 };
  if (count <= 4) return { cols: 2 };
  return { cols: 3 };
}

export function SuccessGrid({
  items,
  accentColor,
  fileNameBase,
  onReset,
}: {
  items: GraphicItem[];
  accentColor?: string;
  fileNameBase?: string;
  onReset: () => void;
}) {
  const count = items.length;
  const { cols } = layoutFor(count);

  return (
    <div className="w-full h-full flex flex-col gap-4 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="text-xl font-semibold text-[#0B192C] tracking-tight">
            הגרפיקות מוכנות
          </div>
          <div className="text-sm text-black/50 mt-0.5">
            {count} Creative Packs נוצרו עבורך — כולל טקסט מודעה וכותרת ממומן
          </div>
        </div>
        <button
          onClick={onReset}
          className="px-4 h-10 rounded-xl text-sm font-medium text-[#0B192C] bg-white border border-black/10 hover:bg-black/5 transition-colors"
        >
          צור שוב
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div
          className="grid gap-5 w-full mx-auto items-start"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {items.map((item, i) => (
            <GraphicCard key={i} item={item} index={i} fileNameBase={fileNameBase} />
          ))}
        </div>
      </div>
    </div>
  );
}
