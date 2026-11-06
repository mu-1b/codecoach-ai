const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
let pyodideReady;

function loadPython() {
  pyodideReady ??= import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`).then(({ loadPyodide }) =>
    loadPyodide({ indexURL: PYODIDE_URL }),
  );
  return pyodideReady;
}

function lockDown() {
  for (const name of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "indexedDB", "caches"]) {
    try {
      Object.defineProperty(self, name, { value: undefined, configurable: false });
    } catch {}
  }
}

async function runPython(source) {
  const py = await loadPython();
  lockDown();
  self.postMessage({ type: "started" });
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s) => (stdout += s + "\n") });
  py.setStderr({ batched: (s) => (stderr += s + "\n") });
  try {
    await py.runPythonAsync(source);
  } catch (err) {
    const lines = String(err.message || err).trim().split("\n");
    const userFrames = lines.filter((l) => !l.includes("/lib/python") && !l.includes("_pyodide"));
    stderr += userFrames.join("\n");
  }
  return { stdout, stderr };
}

function runJavaScript(source) {
  lockDown();
  self.postMessage({ type: "started" });
  let stdout = "";
  let stderr = "";
  const format = (args) =>
    args.map((a) => (typeof a === "string" ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })())).join(" ");
  const sandboxConsole = {
    log: (...a) => (stdout += format(a) + "\n"),
    info: (...a) => (stdout += format(a) + "\n"),
    warn: (...a) => (stderr += format(a) + "\n"),
    error: (...a) => (stderr += format(a) + "\n"),
  };
  try {
    new Function("console", `"use strict";\n${source}`)(sandboxConsole);
  } catch (err) {
    stderr += `${err.name}: ${err.message}`;
  }
  return { stdout, stderr };
}

self.onmessage = async ({ data }) => {
  if (data.type === "preload") {
    await loadPython().catch(() => {});
    return;
  }
  const started = performance.now();
  try {
    const result = data.language === "python" ? await runPython(data.source) : runJavaScript(data.source);
    self.postMessage({ type: "done", ...result, runtimeMs: Math.round(performance.now() - started) });
  } catch (err) {
    self.postMessage({ type: "done", stdout: "", stderr: `Runner error: ${err.message}`, runtimeMs: 0 });
  }
};
