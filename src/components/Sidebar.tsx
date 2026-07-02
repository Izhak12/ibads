import { Sparkles, Users } from "lucide-react";
import { useState } from "react";

const items = [
  { id: "create", label: "יצירת גרפיקה", icon: Sparkles },
  { id: "clients", label: "לקוחות", icon: Users },
];

export function Sidebar() {
  const [active, setActive] = useState("create");
  return (
    <aside className="w-64 shrink-0 h-screen bg-white/70 backdrop-blur-2xl border-l border-black/5 flex flex-col p-6">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-2xl bg-black flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-black">סטודיו</div>
          <div className="text-xs text-black/50">יצירה חכמה</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setActive(it.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "text-black/70 hover:bg-black/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto text-[11px] text-black/40 leading-relaxed">
        גרסה 1.0 · מופעל בקסם
      </div>
    </aside>
  );
}
