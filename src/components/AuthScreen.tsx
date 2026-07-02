import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import logo from "@/assets/ibdigital-logo.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";

type Mode = "login" | "signup";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === "signup" && !name.trim()) return;
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("התחברת בהצלחה", { description: "ברוך הבא ל־IBDIGITAL" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("החשבון נוצר בהצלחה", {
          description: "ברוך הבא ל־IBDIGITAL",
        });
      }
    } catch (err) {
      toast.error("שגיאה", {
        description: err instanceof Error ? err.message : "נסה שוב",
      });
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="flex-1 h-screen flex items-center justify-center p-10 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white rounded-[2rem] border border-black/5 shadow-[0_30px_80px_-30px_rgba(11,25,44,0.3)] p-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden mb-4">
            <img src={logo.url} alt="IBDIGITAL" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-[#0B192C] tracking-tight">
            ברוך הבא ל־IBDIGITAL
          </h1>
          <p className="text-sm text-black/50 mt-1">
            Driven by data. Defined by results.
          </p>
        </div>

        {/* Segmented toggle */}
        <div className="relative flex bg-black/[0.04] rounded-2xl p-1 mb-6">
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm transition-transform duration-300 ease-out"
            style={{
              transform: mode === "login" ? "translateX(0)" : "translateX(-100%)",
            }}
          />
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative flex-1 h-10 text-sm font-medium rounded-xl transition-colors ${
                mode === m ? "text-[#0B192C]" : "text-black/50 hover:text-black/70"
              }`}
            >
              {m === "login" ? "התחברות" : "הרשמה"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#0B192C]/80">שם מלא</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ישראל ישראלי"
                className="w-full h-12 px-4 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-[#0B192C] placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-[#1E67FF]/40 focus:ring-4 focus:ring-[#1E67FF]/10 transition-all"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#0B192C]/80">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              className="w-full h-12 px-4 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-[#0B192C] placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-[#1E67FF]/40 focus:ring-4 focus:ring-[#1E67FF]/10 transition-all text-right"
            />
          </div>


          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#0B192C]/80">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-2xl bg-black/[0.03] border border-black/5 text-sm text-[#0B192C] placeholder:text-black/30 focus:outline-none focus:bg-white focus:border-[#1E67FF]/40 focus:ring-4 focus:ring-[#1E67FF]/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 h-13 py-4 rounded-2xl bg-[#0B192C] text-white text-sm font-medium hover:bg-[#0B192C]/90 active:scale-[0.98] transition-all shadow-[0_10px_30px_-12px_rgba(11,25,44,0.5)] hover:shadow-[0_10px_30px_-8px_rgba(30,103,255,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "רגע…" : mode === "login" ? "התחבר" : "הירשם"}
          </button>


          <div className="text-center text-xs text-black/50 mt-2">
            {mode === "login" ? (
              <>אין לך משתמש?{" "}<button type="button" onClick={() => setMode("signup")} className="text-[#1E67FF] font-medium hover:underline">הרשם</button></>
            ) : (
              <>כבר יש לך חשבון?{" "}<button type="button" onClick={() => setMode("login")} className="text-[#1E67FF] font-medium hover:underline">התחבר</button></>
            )}
          </div>

        </form>
      </motion.div>
    </div>
  );
}
