import { useEffect, useState } from "react";
import { CheckCircle2, FileCode2, Lightbulb, MessagesSquare, Users, XCircle } from "lucide-react";
import Difficulty from "../components/Difficulty.jsx";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.jsx";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-5">
      <div className="flex items-center gap-2 text-sm text-slate-400"><Icon size={15} /> {label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-100">{value}</div>
    </div>
  );
}

function SolveRateChart({ rows }) {
  const [hover, setHover] = useState(null);
  return (
    <div className="space-y-2.5">
      {rows.map((c) => (
        <div
          key={c.slug}
          className="group relative grid grid-cols-[150px_1fr_44px] items-center gap-3 rounded-md py-0.5 text-sm"
          onMouseEnter={() => setHover(c.slug)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="truncate text-slate-400">{c.title}</span>
          <div className="h-3 rounded-r bg-ink-800/60">
            <div className="h-full rounded-r-[4px] bg-[#3987e5]" style={{ width: `${c.solveRate}%`, opacity: hover && hover !== c.slug ? 0.5 : 1 }} />
          </div>
          <span className="text-right tabular-nums text-slate-300">{c.solveRate}%</span>
          {hover === c.slug && (
            <div className="pointer-events-none absolute left-[160px] top-full z-10 mt-1 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-xs shadow-xl">
              <div className="font-medium text-slate-200">{c.title}</div>
              <div className="mt-1 text-slate-400">{c.solveRate}% of {c.students} students solved · {c.avgAttempts} attempts avg</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Instructor() {
  const { user, setSignInOpen } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api("/instructor/analytics").then(setData).catch((e) => setError(e.message));
  }, [user]);

  if (!user || error) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold text-slate-100">Instructor analytics</h1>
        <p className="mt-2 text-sm text-slate-400">{error || "Sign in with an instructor account to view class analytics."}</p>
        <button onClick={() => setSignInOpen(true)} className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          Use the instructor demo
        </button>
      </div>
    );
  }
  if (!data) return <div className="mx-auto mt-10 h-64 max-w-6xl animate-pulse rounded-xl bg-ink-900/60" />;

  const struggling = [...data.challenges].filter((c) => c.students).sort((a, b) => a.solveRate - b.solveRate || b.avgAttempts - a.avgAttempts)[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Class analytics</h1>
          <p className="mt-1 text-sm text-slate-400">Where students succeed, and where they need help.</p>
        </div>
        <span className="rounded-full border border-ink-700 px-3 py-1 text-xs text-slate-500">Includes seeded demo data</span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Students" value={data.totals.students} />
        <Stat icon={FileCode2} label="Submissions" value={data.totals.submissions} />
        <Stat icon={Lightbulb} label="Hints revealed" value={data.totals.hints} />
        <Stat icon={MessagesSquare} label="Tutor questions" value={data.totals.tutorMessages} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-6">
          <h2 className="font-semibold text-slate-100">Solve rate by challenge</h2>
          <p className="mb-5 mt-1 text-xs text-slate-500">Share of students who attempted a challenge and eventually passed it</p>
          <SolveRateChart rows={data.challenges} />
          {struggling && (
            <p className="mt-6 rounded-lg bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90 ring-1 ring-amber-500/20">
              <strong className="font-semibold">{struggling.title}</strong> has the lowest solve rate ({struggling.solveRate}%). Consider reviewing it in class.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-6">
          <h2 className="font-semibold text-slate-100">Recent activity</h2>
          <div className="mt-4 divide-y divide-ink-800">
            {data.recent.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                {s.passed ? <CheckCircle2 size={15} className="text-emerald-400" /> : <XCircle size={15} className="text-rose-400" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-slate-300">{s.student}</div>
                  <div className="truncate text-xs text-slate-500">{s.title} · {s.language}</div>
                </div>
                <span className="text-xs tabular-nums text-slate-500">{s.passedCount}/{s.total}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-x-auto rounded-xl border border-ink-700/70 bg-ink-900/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/70 text-left text-xs text-slate-500">
              <th className="px-5 py-3 font-medium">Challenge</th>
              <th className="px-3 py-3 font-medium">Level</th>
              <th className="px-3 py-3 text-right font-medium">Students</th>
              <th className="px-3 py-3 text-right font-medium">Solve rate</th>
              <th className="px-3 py-3 text-right font-medium">Avg attempts</th>
              <th className="px-3 py-3 text-right font-medium">Hints</th>
              <th className="px-5 py-3 text-right font-medium">Tutor msgs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800 tabular-nums">
            {data.challenges.map((c) => (
              <tr key={c.slug} className="hover:bg-ink-850">
                <td className="px-5 py-3 text-slate-200">{c.title}</td>
                <td className="px-3 py-3"><Difficulty level={c.difficulty} /></td>
                <td className="px-3 py-3 text-right text-slate-400">{c.students}</td>
                <td className="px-3 py-3 text-right text-slate-300">{c.solveRate}%</td>
                <td className="px-3 py-3 text-right text-slate-400">{c.avgAttempts}</td>
                <td className="px-3 py-3 text-right text-slate-400">{c.hints}</td>
                <td className="px-5 py-3 text-right text-slate-400">{c.tutorMessages}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 overflow-x-auto rounded-xl border border-ink-700/70 bg-ink-900/60">
        <h2 className="px-5 pt-5 font-semibold text-slate-100">Students</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/70 text-left text-xs text-slate-500">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-3 py-3 text-right font-medium">Solved</th>
              <th className="px-3 py-3 text-right font-medium">Submissions</th>
              <th className="px-5 py-3 text-right font-medium">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800 tabular-nums">
            {data.students.map((s) => (
              <tr key={s.name} className="hover:bg-ink-850">
                <td className="px-5 py-3 text-slate-200">{s.name}</td>
                <td className="px-3 py-3 text-right text-slate-300">{s.solved}</td>
                <td className="px-3 py-3 text-right text-slate-400">{s.submissions}</td>
                <td className="px-5 py-3 text-right text-slate-500">{new Date(s.lastActive).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
