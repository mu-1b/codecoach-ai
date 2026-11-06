import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, Clock, Lightbulb, Lock, XCircle } from "lucide-react";
import Difficulty from "./Difficulty.jsx";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.jsx";

function timeAgo(date) {
  const s = Math.round((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Hints({ challenge }) {
  const { user, requireUser } = useSession();
  const key = `codecoach:hints:${challenge.slug}`;
  const [hints, setHints] = useState(() => JSON.parse(localStorage.getItem(key) || "[]"));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reveal = async () => {
    if (!requireUser()) return;
    setBusy(true);
    setError("");
    try {
      const { hint } = await api(`/challenges/${challenge.slug}/hints`, { method: "POST", body: { level: hints.length } });
      const next = [...hints, hint];
      setHints(next);
      localStorage.setItem(key, JSON.stringify(next));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const labels = ["Nudge", "Approach", "Plan"];

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        Hints get more specific as you go. Try each one before unlocking the next.
      </p>
      {Array.from({ length: challenge.hintCount }).map((_, i) =>
        hints[i] ? (
          <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-400">
              <Lightbulb size={13} /> Hint {i + 1} · {labels[i] ?? "Hint"}
            </div>
            <div className="prose-coach !text-slate-300"><ReactMarkdown>{hints[i]}</ReactMarkdown></div>
          </div>
        ) : (
          <div key={i} className="flex items-center justify-between rounded-lg border border-dashed border-ink-700 p-3.5 text-sm text-slate-500">
            <span className="flex items-center gap-2"><Lock size={14} /> Hint {i + 1} · {labels[i] ?? "Hint"}</span>
            {i === hints.length && (
              <button onClick={reveal} disabled={busy} className="rounded-md bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/25 disabled:opacity-50">
                {user ? "Reveal" : "Sign in to reveal"}
              </button>
            )}
          </div>
        ),
      )}
      {error && <p className="text-sm text-brand-400">{error}</p>}
    </div>
  );
}

function Submissions({ challenge, refreshKey }) {
  const { user, requireUser } = useSession();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) return;
    api(`/challenges/${challenge.slug}/submissions`).then(setItems).catch(() => setItems([]));
  }, [user, challenge.slug, refreshKey]);

  if (!user) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        <button onClick={requireUser} className="text-brand-400 hover:underline">Sign in</button> to see your submission history.
      </div>
    );
  }
  if (!items) return <div className="h-24 animate-pulse rounded-lg bg-ink-800/50" />;
  if (!items.length) return <p className="py-10 text-center text-sm text-slate-500">No submissions yet. Submit when your tests pass.</p>;

  return (
    <div className="space-y-2">
      {items.map((s) => (
        <div key={s._id} className="flex items-center gap-3 rounded-lg border border-ink-700/70 bg-ink-900 px-3 py-2.5 text-sm">
          {s.passed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-rose-400" />}
          <span className={s.passed ? "text-emerald-300" : "text-rose-300"}>{s.passed ? "Accepted" : "Wrong answer"}</span>
          <span className="text-slate-500">{s.passedCount}/{s.total}</span>
          <span className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-slate-400">{s.language === "python" ? "Python" : "JavaScript"}</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-slate-500"><Clock size={12} /> {timeAgo(s.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProblemPanel({ challenge, tab, setTab, refreshKey }) {
  const tabs = [
    ["description", "Description"],
    ["hints", `Hints (${challenge.hintCount})`],
    ["submissions", "Submissions"],
  ];
  const examples = challenge.tests.filter((t) => !t.hidden);

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-ink-700/70 px-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1 text-xs font-medium ${tab === id ? "bg-ink-800 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">
        {tab === "description" && (
          <>
            <h1 className="text-xl font-semibold text-slate-100">{challenge.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Difficulty level={challenge.difficulty} />
              {challenge.tags.map((t) => (
                <span key={t} className="rounded-md bg-ink-800 px-2 py-0.5 text-xs text-slate-400">{t}</span>
              ))}
            </div>
            <div className="prose-coach mt-4"><ReactMarkdown>{challenge.description}</ReactMarkdown></div>
            <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Test cases</h3>
            <div className="space-y-1.5 font-mono text-[12.5px]">
              {examples.map((t, i) => (
                <div key={i} className="break-all rounded-md bg-ink-950 px-3 py-2 text-slate-400">
                  <span className="text-slate-300">{t.args.map((a) => JSON.stringify(a)).join(", ")}</span>
                  <span className="mx-2 text-slate-600">→</span>
                  <span className="text-emerald-300">{JSON.stringify(t.expected)}</span>
                </div>
              ))}
              <p className="pt-1 font-sans text-xs text-slate-500">
                + {challenge.testCount - examples.length} hidden test{challenge.testCount - examples.length === 1 ? "" : "s"} on submit
              </p>
            </div>
          </>
        )}
        {tab === "hints" && <Hints challenge={challenge} />}
        {tab === "submissions" && <Submissions challenge={challenge} refreshKey={refreshKey} />}
      </div>
    </div>
  );
}
