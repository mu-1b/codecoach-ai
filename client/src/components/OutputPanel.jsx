import { useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, Lock, Terminal, XCircle } from "lucide-react";

const show = (v) => JSON.stringify(v);

function CaseRow({ result, index }) {
  const [open, setOpen] = useState(!result.passed && !result.hidden);
  return (
    <div className="rounded-lg border border-ink-700/70 bg-ink-900">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm">
        {result.passed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-rose-400" />}
        <span className="text-slate-300">
          {result.hidden ? "Hidden test" : "Test"} {index + 1}
        </span>
        {result.hidden && <Lock size={12} className="text-slate-600" />}
        <span className={`ml-auto text-xs ${result.passed ? "text-emerald-400" : "text-rose-400"}`}>{result.passed ? "Passed" : "Failed"}</span>
        {!result.hidden && <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>
      {open && !result.hidden && (
        <div className="space-y-1.5 border-t border-ink-700/70 px-3 py-2.5 font-mono text-[12.5px]">
          <div><span className="inline-block w-20 text-slate-500">Input</span><span className="text-slate-300">{result.args.map(show).join(", ")}</span></div>
          <div><span className="inline-block w-20 text-slate-500">Expected</span><span className="text-emerald-300">{show(result.expected)}</span></div>
          {result.error ? (
            <div><span className="inline-block w-20 text-slate-500">Error</span><span className="text-rose-300">{result.error}</span></div>
          ) : (
            <div><span className="inline-block w-20 text-slate-500">Output</span><span className={result.passed ? "text-emerald-300" : "text-rose-300"}>{show(result.output ?? null)}</span></div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OutputPanel({ run, running, verdict }) {
  const [tab, setTab] = useState("tests");
  const results = run?.results;
  const passed = results?.filter((r) => r.passed).length ?? 0;
  const hasConsole = Boolean(run?.stdout || run?.stderr);

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-ink-700/70 px-2">
        {[["tests", "Test results"], ["console", "Console"]].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1 text-xs font-medium ${tab === id ? "bg-ink-800 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}
          >
            {label}
            {id === "console" && hasConsole && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-brand-400 align-middle" />}
          </button>
        ))}
        {run?.runtimeMs != null && !running && <span className="ml-auto pr-2 text-xs text-slate-500">{run.runtimeMs} ms</span>}
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto p-3">
        {running && (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Running your code…
          </div>
        )}

        {!running && !run && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
            <Terminal size={22} className="text-slate-600" />
            Run your code to see test results here.
            <span className="text-xs text-slate-600">Ctrl/⌘ + Enter</span>
          </div>
        )}

        {!running && run && tab === "tests" && (
          <div className="space-y-2">
            {verdict && (
              <div className={`rounded-lg border px-4 py-3 text-sm ${verdict.passed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
                {verdict.passed
                  ? "Accepted! Every test passed and your submission was saved."
                  : `Submission saved: ${verdict.passedCount}/${verdict.total} tests passed. Ask the tutor what to look at next.`}
              </div>
            )}
            {results ? (
              <>
                <div className="flex items-center gap-3 pb-1">
                  <span className={`text-sm font-semibold ${passed === results.length ? "text-emerald-400" : "text-rose-400"}`}>
                    {passed === results.length ? "All tests passed" : `${passed} / ${results.length} tests passed`}
                  </span>
                  <div className="flex h-1.5 flex-1 gap-0.5 overflow-hidden rounded-full">
                    {results.map((r, i) => (
                      <div key={i} className={`flex-1 ${r.passed ? "bg-emerald-500" : "bg-rose-500/70"}`} />
                    ))}
                  </div>
                </div>
                {results.map((r, i) => <CaseRow key={i} result={r} index={i} />)}
              </>
            ) : (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                <p className="text-sm font-medium text-rose-300">Your code didn't finish running.</p>
                {run.stderr && <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-rose-200/80">{run.stderr}</pre>}
              </div>
            )}
          </div>
        )}

        {!running && run && tab === "console" && (
          <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed">
            {run.stdout && <span className="text-slate-300">{run.stdout}</span>}
            {run.stderr && <span className="block text-rose-300">{run.stderr}</span>}
            {!hasConsole && <span className="text-slate-600">No output. Use print() or console.log() to debug.</span>}
          </pre>
        )}
      </div>
    </div>
  );
}
