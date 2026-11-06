import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { ChevronLeft, ChevronRight, Loader2, Play, RotateCcw, Send } from "lucide-react";
import NavBar from "../components/NavBar.jsx";
import ProblemPanel from "../components/ProblemPanel.jsx";
import OutputPanel from "../components/OutputPanel.jsx";
import TutorChat from "../components/TutorChat.jsx";
import { api } from "../lib/api.js";
import { runCode, warmUp } from "../lib/runner.js";
import { useSession } from "../lib/session.jsx";

const ORDER = [
  "reverse-string", "fizzbuzz", "count-vowels", "palindrome",
  "two-sum", "valid-parentheses", "longest-unique-substring", "merge-intervals",
];
const LANGUAGES = { python: "Python 3", javascript: "JavaScript" };

function useIsDesktop() {
  const query = "(min-width: 1024px)";
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return match;
}

function defineTheme(monaco) {
  monaco.editor.defineTheme("codecoach", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6b7280", fontStyle: "italic" },
      { token: "keyword", foreground: "ff8a8a" },
      { token: "string", foreground: "86efac" },
      { token: "number", foreground: "fcd34d" },
    ],
    colors: {
      "editor.background": "#0b0d12",
      "editor.lineHighlightBackground": "#161a23",
      "editorLineNumber.foreground": "#3b4252",
      "editorLineNumber.activeForeground": "#9ca3af",
      "editor.selectionBackground": "#f0484833",
      "editorCursor.foreground": "#ff6b6b",
      "editorIndentGuide.background1": "#1c212c",
    },
  });
}

export default function Workspace() {
  const { slug } = useParams();
  const { user, config, requireUser } = useSession();
  const isDesktop = useIsDesktop();

  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState(() => localStorage.getItem("codecoach:lang") || "python");
  const [code, setCode] = useState("");
  const [run, setRun] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leftTab, setLeftTab] = useState("description");
  const [mobileTab, setMobileTab] = useState("problem");
  const [refreshKey, setRefreshKey] = useState(0);
  const runRef = useRef();

  const storageKey = `codecoach:code:${slug}:${language}`;

  useEffect(() => {
    setChallenge(null);
    setError("");
    setRun(null);
    setVerdict(null);
    setLeftTab("description");
    api(`/challenges/${slug}`).then(setChallenge).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (!challenge) return;
    setCode(localStorage.getItem(storageKey) ?? challenge.starter[language]);
    localStorage.setItem("codecoach:lang", language);
    if (config.runner === "browser") warmUp(language);
  }, [challenge, language, storageKey, config.runner]);

  const updateCode = (value = "") => {
    setCode(value);
    localStorage.setItem(storageKey, value);
  };

  const execute = useCallback(async () => {
    if (!challenge || running) return null;
    setRunning(true);
    setVerdict(null);
    if (!isDesktop) setMobileTab("code");
    try {
      const result = await runCode(config.runner, challenge, language, code);
      setRun(result);
      return result;
    } catch (e) {
      const result = { stdout: "", stderr: e.message, results: null };
      setRun(result);
      return null;
    } finally {
      setRunning(false);
    }
  }, [challenge, running, config.runner, language, code, isDesktop]);

  runRef.current = execute;

  const submit = async () => {
    if (!requireUser() || !challenge) return;
    setSubmitting(true);
    try {
      let body = { language, code };
      if (config.runner === "browser") {
        const result = await execute();
        if (!result?.results) return;
        body = { ...body, results: result.results.map((r) => ({ passed: r.passed })), runtimeMs: result.runtimeMs };
      }
      const { submission, results } = await api(`/challenges/${challenge.slug}/submit`, { method: "POST", body });
      if (results) setRun((r) => ({ ...r, results, runtimeMs: submission.runtimeMs }));
      setVerdict(submission);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setRun((r) => ({ ...(r ?? {}), results: r?.results ?? null, stderr: e.message }));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    if (!confirm("Reset your code to the starter template?")) return;
    localStorage.removeItem(storageKey);
    setCode(challenge.starter[language]);
  };

  const index = ORDER.indexOf(slug);
  const prev = ORDER[index - 1];
  const next = ORDER[index + 1];
  const canRun = config.runner !== "disabled";

  const toolbar = (
    <>
      <div className="mr-auto hidden items-center gap-1 lg:flex">
        <Link to={prev ? `/challenges/${prev}` : "#"} className={`rounded p-1 ${prev ? "text-slate-400 hover:bg-ink-800 hover:text-slate-200" : "pointer-events-none text-slate-700"}`}>
          <ChevronLeft size={16} />
        </Link>
        <span className="max-w-48 truncate text-sm text-slate-300">{challenge?.title ?? "…"}</span>
        <Link to={next ? `/challenges/${next}` : "#"} className={`rounded p-1 ${next ? "text-slate-400 hover:bg-ink-800 hover:text-slate-200" : "pointer-events-none text-slate-700"}`}>
          <ChevronRight size={16} />
        </Link>
      </div>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-500"
      >
        {Object.entries(LANGUAGES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <button onClick={reset} title="Reset code" className="rounded-lg p-2 text-slate-500 hover:bg-ink-800 hover:text-slate-200">
        <RotateCcw size={15} />
      </button>
      <button
        onClick={execute}
        disabled={!canRun || running || !challenge}
        title={canRun ? "Run (Ctrl+Enter)" : "Code execution is disabled on this server"}
        className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-ink-700 disabled:opacity-40"
      >
        {running && !submitting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run
      </button>
      <button
        onClick={submit}
        disabled={!canRun || submitting || running || !challenge}
        className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40"
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit
      </button>
    </>
  );

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <NavBar />
        <div className="m-auto text-center">
          <p className="text-slate-300">{error}</p>
          <Link to="/challenges" className="mt-4 inline-block text-sm text-brand-400 hover:underline">Back to challenges</Link>
        </div>
      </div>
    );
  }

  const editor = (
    <div className="flex h-full flex-col bg-ink-950">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ink-700/70 bg-ink-900 px-4 text-xs text-slate-500">
        <span className="font-mono">{language === "python" ? "solution.py" : "solution.js"}</span>
        {!canRun && <span className="ml-auto text-amber-400">Execution disabled on this server</span>}
        {canRun && <span className="ml-auto">{config.runner === "browser" ? "Runs in a sandboxed browser worker" : "Runs in an isolated container"}</span>}
      </div>
      <div className="min-h-0 flex-1">
        {challenge && (
          <Editor
            language={language}
            value={code}
            onChange={updateCode}
            theme="codecoach"
            beforeMount={defineTheme}
            onMount={(ed, monaco) => {
              ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.());
            }}
            loading={<Loader2 className="animate-spin text-slate-600" />}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 14 },
              tabSize: language === "python" ? 4 : 2,
              automaticLayout: true,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              renderLineHighlight: "all",
            }}
          />
        )}
      </div>
    </div>
  );

  const problem = challenge ? (
    <ProblemPanel challenge={challenge} tab={leftTab} setTab={setLeftTab} refreshKey={refreshKey} />
  ) : (
    <div className="h-full animate-pulse bg-ink-900" />
  );
  const output = <OutputPanel run={run} running={running} verdict={verdict} />;
  const tutor = challenge ? (
    <TutorChat
      key={`${challenge.slug}:${user?.id ?? "anon"}`}
      challenge={challenge}
      language={language}
      code={code}
      lastRun={run}
      onOpenHints={() => { setLeftTab("hints"); setMobileTab("problem"); }}
    />
  ) : (
    <div className="h-full bg-ink-900" />
  );

  return (
    <div className="flex h-full flex-col">
      <NavBar>{toolbar}</NavBar>
      {isDesktop ? (
        <Group orientation="horizontal" className="min-h-0 flex-1">
          <Panel defaultSize="28" minSize="18">{problem}</Panel>
          <Separator className="w-px" />
          <Panel defaultSize="47" minSize="30">
            <Group orientation="vertical">
              <Panel defaultSize="64" minSize="25">{editor}</Panel>
              <Separator className="h-px" />
              <Panel defaultSize="36" minSize="15">{output}</Panel>
            </Group>
          </Panel>
          <Separator className="w-px" />
          <Panel defaultSize="25" minSize="18">{tutor}</Panel>
        </Group>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 border-b border-ink-700/70 bg-ink-900">
            {[["problem", "Problem"], ["code", "Code"], ["tutor", "Tutor"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className={`flex-1 py-2.5 text-sm ${mobileTab === id ? "border-b-2 border-brand-500 text-slate-100" : "text-slate-500"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {mobileTab === "problem" && problem}
            {mobileTab === "code" && (
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-[3]">{editor}</div>
                <div className="min-h-0 flex-[2] border-t border-ink-700">{output}</div>
              </div>
            )}
            {mobileTab === "tutor" && tutor}
          </div>
        </div>
      )}
    </div>
  );
}
