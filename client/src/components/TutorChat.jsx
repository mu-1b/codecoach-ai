import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Lightbulb, SendHorizontal, Sparkles, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.jsx";

const SUGGESTIONS = ["I'm stuck. Where should I start?", "Why is my test failing?", "Is my approach efficient?"];

function summarizeRun(run) {
  if (!run) return undefined;
  const parts = [];
  if (run.results) {
    run.results.forEach((r, i) => {
      if (r.hidden) parts.push(`Hidden test ${i + 1}: ${r.passed ? "passed" : "failed"}`);
      else parts.push(`Test ${i + 1} ${r.passed ? "passed" : "failed"}: input ${JSON.stringify(r.args)}, expected ${JSON.stringify(r.expected)}, got ${r.error ?? JSON.stringify(r.output ?? null)}`);
    });
  }
  if (run.stderr) parts.push(`stderr: ${run.stderr}`);
  return parts.join("\n").slice(0, 4000);
}

export default function TutorChat({ challenge, language, code, lastRun, onOpenHints }) {
  const { config, requireUser } = useSession();
  const key = `codecoach:chat:${challenge.slug}`;
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem(key) || "[]"));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(messages.slice(-30)));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, key]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || busy || !requireUser()) return;
    const next = [...messages, { role: "user", content }].slice(-30);
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const { reply } = await api("/tutor", {
        method: "POST",
        body: { challenge: challenge.slug, language, code, lastRun: summarizeRun(lastRun), messages: next },
      });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message);
      setMessages(messages);
      setInput(content);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ink-700/70 px-3">
        <Sparkles size={14} className="text-brand-400" />
        <span className="text-xs font-semibold text-slate-200">AI Tutor</span>
        <span className={`ml-1 size-1.5 rounded-full ${config.tutor ? "bg-emerald-400" : "bg-slate-600"}`} title={config.tutor ? "Online" : "Offline"} />
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} title="Clear conversation" className="ml-auto rounded p-1 text-slate-500 hover:bg-ink-800 hover:text-slate-300">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {!config.tutor && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200/90">
            The AI tutor isn't configured on this server.
            <button onClick={onOpenHints} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:underline">
              <Lightbulb size={13} /> Use progressive hints instead
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="px-1 pt-2 text-center">
            <div className="mx-auto grid size-10 place-items-center rounded-full bg-brand-500/15">
              <Bot size={20} className="text-brand-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-200">Hi! I'm your coding coach.</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              I can see your code and test results. I won't give you the answer, but I'll ask questions that help you find it.
            </p>
            <div className="mt-4 space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={!config.tutor}
                  className="block w-full rounded-lg border border-ink-700 px-3 py-2 text-left text-xs text-slate-300 hover:border-brand-500/50 hover:bg-ink-800 disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-500 px-3.5 py-2 text-sm text-white">{m.content}</div>
            </div>
          ) : (
            <div key={i} className="flex gap-2">
              <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-500/15">
                <Bot size={13} className="text-brand-400" />
              </div>
              <div className="prose-coach min-w-0 rounded-2xl rounded-tl-sm bg-ink-800 px-3.5 py-1 !text-[13.5px]">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          ),
        )}

        {busy && (
          <div className="flex gap-2">
            <div className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500/15">
              <Bot size={13} className="text-brand-400" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-ink-800 px-4 py-3">
              {[0, 150, 300].map((d) => (
                <span key={d} className="size-1.5 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        {error && <p className="rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-400">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-ink-700/70 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-ink-700 bg-ink-950 p-1.5 focus-within:border-brand-500/60">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={2000}
            disabled={!config.tutor}
            placeholder={config.tutor ? "Ask about your code…" : "Tutor offline"}
            className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-600"
          />
          <button disabled={busy || !input.trim() || !config.tutor} className="grid size-9 place-items-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-30">
            <SendHorizontal size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
