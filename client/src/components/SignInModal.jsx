import { useState } from "react";
import { GraduationCap, Presentation, X } from "lucide-react";
import { useSession } from "../lib/session.jsx";

export default function SignInModal() {
  const { signInOpen, setSignInOpen, signIn } = useSession();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!signInOpen) return null;

  const go = async (n, role) => {
    setBusy(true);
    setError("");
    try {
      await signIn(n, role);
      setName("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSignInOpen(false)}>
      <div className="w-full max-w-sm rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Welcome to CodeCoach</h2>
            <p className="mt-1 text-sm text-slate-400">Pick a name to save your progress.</p>
          </div>
          <button onClick={() => setSignInOpen(false)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); go(name, "student"); }} className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-brand-500"
          />
          <button disabled={busy || name.trim().length < 2} className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40">
            Start learning
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-brand-400">{error}</p>}
        <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
          <div className="h-px flex-1 bg-ink-700" /> or try a demo account <div className="h-px flex-1 bg-ink-700" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button disabled={busy} onClick={() => go("Demo Student", "student")} className="flex items-center justify-center gap-2 rounded-lg border border-ink-700 py-2 text-sm text-slate-300 hover:bg-ink-800">
            <GraduationCap size={15} /> Student
          </button>
          <button disabled={busy} onClick={() => go("Prof. Rivera", "instructor")} className="flex items-center justify-center gap-2 rounded-lg border border-ink-700 py-2 text-sm text-slate-300 hover:bg-ink-800">
            <Presentation size={15} /> Instructor
          </button>
        </div>
      </div>
    </div>
  );
}
