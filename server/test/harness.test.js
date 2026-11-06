import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import challenges from "../src/data/challenges.js";
import { buildProgram, parseOutput } from "../../shared/harness.js";

const solutions = {
  "reverse-string": {
    python: "def reverse_string(s):\n    return s[::-1]",
    javascript: "function reverseString(s) { return [...s].reverse().join(''); }",
  },
  fizzbuzz: {
    python: "def fizzbuzz(n):\n    return ['FizzBuzz' if i % 15 == 0 else 'Fizz' if i % 3 == 0 else 'Buzz' if i % 5 == 0 else str(i) for i in range(1, n + 1)]",
    javascript: "function fizzbuzz(n) { return Array.from({ length: n }, (_, k) => { const i = k + 1; return i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i); }); }",
  },
  "count-vowels": {
    python: "def count_vowels(text):\n    return sum(ch in 'aeiou' for ch in text.lower())",
    javascript: "function countVowels(text) { return [...text.toLowerCase()].filter((c) => 'aeiou'.includes(c)).length; }",
  },
  palindrome: {
    python: "def is_palindrome(s):\n    t = [c.lower() for c in s if c.isalnum()]\n    return t == t[::-1]",
    javascript: "function isPalindrome(s) { const t = s.toLowerCase().replace(/[^a-z0-9]/g, ''); return t === [...t].reverse().join(''); }",
  },
  "two-sum": {
    python: "def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return (seen[target - n], i)\n        seen[n] = i",
    javascript: "function twoSum(nums, target) { const seen = new Map(); for (let i = 0; i < nums.length; i++) { if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i]; seen.set(nums[i], i); } }",
  },
  "valid-parentheses": {
    python: "def is_balanced(s):\n    pairs = {')': '(', ']': '[', '}': '{'}\n    stack = []\n    for c in s:\n        if c in pairs:\n            if not stack or stack.pop() != pairs[c]:\n                return False\n        else:\n            stack.append(c)\n    return not stack",
    javascript: "function isBalanced(s) { const p = { ')': '(', ']': '[', '}': '{' }; const st = []; for (const c of s) { if (p[c]) { if (st.pop() !== p[c]) return false; } else st.push(c); } return st.length === 0; }",
  },
  "longest-unique-substring": {
    python: "def longest_unique(s):\n    last, left, best = {}, 0, 0\n    for i, c in enumerate(s):\n        if last.get(c, -1) >= left:\n            left = last[c] + 1\n        last[c] = i\n        best = max(best, i - left + 1)\n    return best",
    javascript: "function longestUnique(s) { const last = new Map(); let left = 0, best = 0; [...s].forEach((c, i) => { if ((last.get(c) ?? -1) >= left) left = last.get(c) + 1; last.set(c, i); best = Math.max(best, i - left + 1); }); return best; }",
  },
  "merge-intervals": {
    python: "def merge_intervals(intervals):\n    out = []\n    for a, b in sorted(intervals):\n        if out and a <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], b)\n        else:\n            out.append([a, b])\n    return out",
    javascript: "function mergeIntervals(iv) { const out = []; for (const [a, b] of [...iv].sort((x, y) => x[0] - y[0])) { if (out.length && a <= out.at(-1)[1]) out.at(-1)[1] = Math.max(out.at(-1)[1], b); else out.push([a, b]); } return out; }",
  },
};

const interpreters = { python: ["python", ["-"]], javascript: ["node", ["-"]] };

function run(language, source) {
  const [cmd, args] = interpreters[language];
  return spawnSync(cmd, args, { input: source, encoding: "utf8", timeout: 10000 });
}

const pythonAvailable = run("python", "print(1)").status === 0;

for (const language of ["python", "javascript"]) {
  for (const c of challenges) {
    test(`${language}: reference solution passes ${c.slug}`, { skip: language === "python" && !pythonAvailable }, () => {
      const program = buildProgram(language, solutions[c.slug][language], c.functionName[language], c.tests);
      const out = run(language, program);
      const { results } = parseOutput(out.stdout, c.tests);
      assert.ok(results, out.stderr);
      assert.equal(results.length, c.tests.length);
      assert.ok(results.every((r) => r.passed), JSON.stringify(results));
    });

    test(`${language}: starter code fails ${c.slug} without crashing`, { skip: language === "python" && !pythonAvailable }, () => {
      const program = buildProgram(language, c.starter[language], c.functionName[language], c.tests);
      const { results } = parseOutput(run(language, program).stdout, c.tests);
      assert.ok(results);
      assert.ok(results.some((r) => !r.passed));
    });
  }
}

test("hidden test details are not exposed", () => {
  const c = challenges[0];
  const program = buildProgram("javascript", solutions[c.slug].javascript, c.functionName.javascript, c.tests);
  const { results } = parseOutput(run("javascript", program).stdout, c.tests);
  const hidden = results.find((r) => r.hidden);
  assert.equal(hidden.args, undefined);
  assert.equal(hidden.output, undefined);
});

test("user prints are kept separate from results", () => {
  const c = challenges[0];
  const code = `${solutions[c.slug].python}\nprint("debug line")`;
  const program = buildProgram("python", code, c.functionName.python, c.tests);
  const parsed = parseOutput(run("python", program).stdout, c.tests);
  assert.equal(parsed.stdout.trim(), "debug line");
});
