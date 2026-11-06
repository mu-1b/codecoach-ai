export const RESULT_MARKER = "__CODECOACH_RESULTS__";

export function buildProgram(language, code, functionName, cases) {
  const payload = JSON.stringify(cases.map(({ args, expected }) => ({ args, expected })));

  if (language === "python") {
    return `${code}

import json as __json
__cases = __json.loads(${JSON.stringify(payload)})
__results = []
for __c in __cases:
    try:
        __out = ${functionName}(*__c["args"])
        __norm = __json.loads(__json.dumps(__out, default=repr))
        __results.append({"passed": __norm == __c["expected"], "output": __norm})
    except Exception as __e:
        __results.append({"passed": False, "error": type(__e).__name__ + ": " + str(__e)})
print("\\n${RESULT_MARKER}" + __json.dumps(__results, default=repr))
`;
  }

  if (language === "javascript") {
    return `${code}

;(() => {
  const __cases = ${payload};
  const __results = __cases.map((c) => {
    try {
      const out = ${functionName}(...structuredClone(c.args));
      const norm = out === undefined ? null : JSON.parse(JSON.stringify(out));
      return { passed: JSON.stringify(norm) === JSON.stringify(c.expected), output: norm };
    } catch (e) {
      return { passed: false, error: String(e && e.message ? e.name + ": " + e.message : e) };
    }
  });
  console.log("\\n${RESULT_MARKER}" + JSON.stringify(__results));
})();
`;
  }

  throw new Error(`Unsupported language: ${language}`);
}

export function parseOutput(stdout, cases) {
  const idx = stdout.lastIndexOf(RESULT_MARKER);
  if (idx === -1) return { stdout: stdout.trimEnd(), results: null };
  let results = null;
  try {
    results = JSON.parse(stdout.slice(idx + RESULT_MARKER.length).trim());
  } catch {
    results = null;
  }
  const merged = results?.map((r, i) => ({
    ...r,
    args: cases[i].hidden ? undefined : cases[i].args,
    expected: cases[i].hidden ? undefined : cases[i].expected,
    hidden: Boolean(cases[i].hidden),
    output: cases[i].hidden ? undefined : r.output,
  }));
  return { stdout: stdout.slice(0, idx).trimEnd(), results: merged };
}
