import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, CircleDashed, CircleDot, Search } from "lucide-react";
import Difficulty from "../components/Difficulty.jsx";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.jsx";

const FILTERS = ["all", "beginner", "intermediate", "hard"];

const statusIcon = {
  solved: <CheckCircle2 size={18} className="text-emerald-400" />,
  attempted: <CircleDot size={18} className="text-amber-400" />,
  new: <CircleDashed size={18} className="text-slate-600" />,
};

export default function Challenges() {
  const { user } = useSession();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/challenges").then(setItems).catch((e) => setError(e.message));
  }, [user]);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return (items ?? []).filter(
      (c) =>
        (filter === "all" || c.difficulty === filter) &&
        (!q || c.title.toLowerCase().includes(q) || c.tags.some((t) => t.includes(q))),
    );
  }, [items, filter, query]);

  const solved = items?.filter((c) => c.status === "solved").length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Challenges</h1>
          <p className="mt-1 text-sm text-slate-400">
            {user ? `${solved} of ${items?.length ?? 8} solved. Keep going!` : "Sign in to track which challenges you've solved."}
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or topic"
            className="w-64 rounded-lg border border-ink-700 bg-ink-900 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-600 focus:border-brand-500"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm capitalize transition-colors ${
              filter === f ? "bg-slate-100 font-medium text-ink-950" : "bg-ink-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="mt-8 rounded-lg border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-brand-400">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-ink-700/70">
        {!items && !error &&
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[76px] animate-pulse border-b border-ink-800 bg-ink-900/50" />)}
        {visible.map((c) => (
          <Link
            key={c.slug}
            to={`/challenges/${c.slug}`}
            className="group flex items-center gap-4 border-b border-ink-800 bg-ink-900/40 px-5 py-4 transition-colors last:border-0 hover:bg-ink-850"
          >
            {statusIcon[c.status ?? "new"]}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-100">{c.title}</span>
                <Difficulty level={c.difficulty} />
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-500">{c.summary}</p>
            </div>
            <div className="hidden gap-1.5 md:flex">
              {c.tags.map((t) => (
                <span key={t} className="rounded-md bg-ink-800 px-2 py-0.5 text-xs text-slate-400">{t}</span>
              ))}
            </div>
            <ChevronRight size={18} className="text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300" />
          </Link>
        ))}
        {items && !visible.length && <p className="p-10 text-center text-sm text-slate-500">No challenges match that search.</p>}
      </div>
    </div>
  );
}
