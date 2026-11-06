import { buildProgram, parseOutput } from "../../../shared/harness.js";
import { api } from "./api.js";

const TIME_LIMIT_MS = 6000;
const LOAD_LIMIT_MS = 60000;
const testCache = new Map();

const spare = {};

function createWorker(language) {
  const worker = new Worker(new URL("./runner.worker.js", import.meta.url), { type: "module" });
  if (language === "python") worker.postMessage({ type: "preload" });
  return worker;
}

export function warmUp(language) {
  spare[language] ??= createWorker(language);
}

function takeWorker(language) {
  const worker = spare[language] ?? createWorker(language);
  spare[language] = createWorker(language);
  return worker;
}

function runInWorker(language, source) {
  return new Promise((resolve) => {
    const worker = takeWorker(language);
    const finish = (result) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };
    let timer = setTimeout(
      () => finish({ stdout: "", stderr: "Python runtime took too long to load. Check your connection.", runtimeMs: 0 }),
      LOAD_LIMIT_MS,
    );
    worker.onmessage = ({ data }) => {
      if (data.type === "started") {
        clearTimeout(timer);
        timer = setTimeout(
          () => finish({ stdout: "", stderr: `Time limit exceeded (${TIME_LIMIT_MS / 1000}s). Is there an infinite loop?`, runtimeMs: TIME_LIMIT_MS }),
          TIME_LIMIT_MS,
        );
      } else if (data.type === "done") {
        finish(data);
      }
    };
    worker.onerror = (e) => finish({ stdout: "", stderr: `Runner crashed: ${e.message}`, runtimeMs: 0 });
    worker.postMessage({ language, source });
  });
}

async function browserRun(challenge, language, code) {
  if (!testCache.has(challenge.slug)) testCache.set(challenge.slug, await api(`/challenges/${challenge.slug}/tests`));
  const tests = testCache.get(challenge.slug);
  const source = buildProgram(language, code, challenge.functionName[language], tests);
  const raw = await runInWorker(language, source);
  const { stdout, results } = parseOutput(raw.stdout, tests);
  return { stdout, stderr: raw.stderr.trim(), results, runtimeMs: raw.runtimeMs };
}

export async function runCode(mode, challenge, language, code) {
  if (mode === "browser") return browserRun(challenge, language, code);
  if (mode === "docker") return api(`/challenges/${challenge.slug}/run`, { method: "POST", body: { language, code } });
  throw new Error("Code execution is disabled on this server.");
}
