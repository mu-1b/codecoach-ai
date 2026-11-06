import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { buildProgram, parseOutput } from "../../../shared/harness.js";

const IMAGES = {
  python: { image: "python:3.12-alpine", cmd: ["python", "-"] },
  javascript: { image: "node:22-alpine", cmd: ["node", "-"] },
};
const TIMEOUT_MS = 10000;
const MAX_OUTPUT = 64 * 1024;

function runContainer(language, source) {
  const { image, cmd } = IMAGES[language];
  const name = `codecoach-${randomUUID()}`;
  const args = [
    "run", "--rm", "-i", "--name", name,
    "--network", "none",
    "--memory", "128m", "--memory-swap", "128m",
    "--cpus", "0.5",
    "--pids-limit", "64",
    "--read-only", "--tmpfs", "/tmp:rw,size=16m",
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges",
    "--user", "65534:65534",
    image, ...cmd,
  ];

  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn("docker", args);
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      spawn("docker", ["kill", name]);
      child.kill("SIGKILL");
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => { if (stdout.length < MAX_OUTPUT) stdout += d; });
    child.stderr.on("data", (d) => { if (stderr.length < MAX_OUTPUT) stderr += d; });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout: "", stderr: `Runner unavailable: ${err.message}`, exitCode: -1, timedOut, runtimeMs: 0 });
    });
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode, timedOut, runtimeMs: Date.now() - started });
    });

    child.stdin.end(source);
  });
}

export async function runInDocker(challenge, language, code) {
  const program = buildProgram(language, code, challenge.functionName[language], challenge.tests);
  const raw = await runContainer(language, program);
  const { stdout, results } = parseOutput(raw.stdout, challenge.tests);
  return {
    stdout,
    stderr: raw.timedOut ? `Time limit exceeded (${TIMEOUT_MS / 1000}s)` : raw.stderr.trim(),
    results,
    runtimeMs: raw.runtimeMs,
  };
}
