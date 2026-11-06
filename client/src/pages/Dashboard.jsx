import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Flame, Lightbulb, Target, Trophy, XCircle } from "lucide-react";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.jsx";

const LEVELS = [
  ["beginner", "Beginner", "bg-emerald-500"],
  ["intermediate", "Intermediate", "bg-amber-500"],
  ["hard", "Hard", "bg-rose-500"],
];

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-5">
      <div className="flex items-center gap-2 text-sm text-slate-400"><Icon size={15} /> {label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-100">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user, setSignInOpen } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setData(null);
    api("/progress").then(setData).catch((e) => setError(e.message));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <Trophy size={28} className="mx-auto text-brand-400" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-100">Track your progress</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to see solved challenges, streaks and submission history.</p>
        <button onClick={() => setSignInOpen(true)} className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          Sign in
        </button>
      </div>
    );
  }

  if (error) return <p className="mx-auto max-w-5xl px-6 py-10 text-brand-400">{error}</p>;
  if (!data) return <div className="mx-auto mt-10 h-64 max-w-5xl animate-pulse rounded-xl bg-ink-900/60" />;

  const pct = Math.round((data.solved / data.total) * 100);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-100">Welcome back, {data.user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-slate-400">Here's how your practice is going.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Trophy} label="Solved" value={`${data.solved}/${data.total}`} sub={`${data.attempted} attempted`} />
        <Stat icon={Target} label="Acceptance" value={`${data.acceptance}%`} sub={`${data.submissions} submissions`} />
        <Stat icon={Flame} label="Streak" value={`${data.streak}d`} sub="consecutive days practiced" />
        <Stat icon={Lightbulb} label="Hints used" value={data.hintsUsed} sub="no shame in asking" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-6">
          <h2 className="font-semibold text-slate-100">Overall progress</h2>
          <div className="mt-5 flex items-center gap-5">
            <div className="relative size-28 shrink-0">
              <svg viewBox="0 0 36 36" className="size-28 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1c212c" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f04848" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${pct} 100`} />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-xl font-semibold text-slate-100">{pct}%</div>
            </div>
            <div className="flex-1 space-y-3">
              {LEVELS.map(([id, label, color]) => {
                const d = data.byDifficulty[id] ?? { solved: 0, total: 0 };
                return (
                  <div key={id}>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{label}</span>
                      <span className="tabular-nums text-slate-300">{d.solved}/{d.total}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-800">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${d.total ? (d.solved / d.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Link to="/challenges" className="mt-6 block rounded-lg bg-ink-800 py-2 text-center text-sm text-slate-200 hover:bg-ink-700">
            {data.solved === data.total ? "Review challenges" : "Continue practicing"}
          </Link>
        </section>

        <section className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-6">
          <h2 className="font-semibold text-slate-100">Recent submissions</h2>
          {data.recent.length ? (
            <div className="mt-4 divide-y divide-ink-800">
              {data.recent.map((s) => (
                <Link key={s.id} to={`/challenges/${s.challenge}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-slate-100">
                  {s.passed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-rose-400" />}
                  <span className="flex-1 truncate text-slate-300">{s.title}</span>
                  <span className="text-xs text-slate-500">{s.passedCount}/{s.total}</span>
                  <span className="w-20 text-right text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-slate-500">
              Nothing yet. <Link to="/challenges/reverse-string" className="text-brand-400 hover:underline">Try your first challenge</Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
