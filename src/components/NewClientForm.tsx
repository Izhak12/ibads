import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function NewClientForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-sm text-black/60 hover:text-black transition-colors self-start"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה
      </button>
      <div>
        <h1 className="text-2xl font-semibold text-black tracking-tight">
          לקוח חדש
        </h1>
        <p className="text-sm text-black/50 mt-1">הוסף לקוח למאגר שלך</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black/80">שם הלקוח</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: קפה שקד"
          className="w-full h-12 px-4 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-black/20 focus:ring-4 focus:ring-black/5 transition-all"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black/80">הערות</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="פרטים על סגנון, מותג, קהל יעד..."
          rows={4}
          className="w-full px-4 py-3 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-black/20 focus:ring-4 focus:ring-black/5 transition-all resize-none"
        />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => name.trim() && onSave(name.trim())}
          disabled={!name.trim()}
          className="flex-1 h-12 rounded-2xl bg-black text-white text-sm font-medium hover:bg-black/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          שמור לקוח
        </button>
        <button
          onClick={onCancel}
          className="px-6 h-12 rounded-2xl bg-black/5 text-black text-sm font-medium hover:bg-black/10 transition-colors"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
