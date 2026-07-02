import { Sparkles, Users, LogIn } from "lucide-react";
import logo from "@/assets/ibdigital-logo.jpg.asset.json";

export type Tab = "create" | "clients" | "auth";

const items: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: "create", label: "יצירת גרפיקה", icon: Sparkles },
  { id: "clients", label: "לקוחות", icon: Users },
  { id: "auth", label: "התחברות / הרשמה", icon: LogIn },
];

export function Sidebar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <aside className="w-64 shrink-0 h-screen bg-white/70 backdrop-blur-2xl border-l border-black/5 flex flex-col p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-11 h-11 rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
          <img src={logo.url} alt="IBDIGITAL" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#0B192C] tracking-wide">IBDIGITAL</div>
          <div className="text-[11px] text-black/50 truncate">Driven by data.</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#0B192C] text-white shadow-[0_8px_24px_-12px_rgba(11,25,44,0.6)]"
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
        © IBDIGITAL · Studio
      </div>
    </aside>
  );
}
