const challenges = [
  {
    slug: "reverse-string",
    title: "Reverse a String",
    difficulty: "beginner",
    tags: ["strings"],
    summary: "Return the characters of a string in reverse order.",
    description: `Write a function that takes a string and returns it reversed.

**Example**

\`\`\`
reverse("coach")  ->  "hcaoc"
reverse("")       ->  ""
\`\`\``,
    functionName: { python: "reverse_string", javascript: "reverseString" },
    starter: {
      python: `def reverse_string(s):\n    # your code here\n    pass\n`,
      javascript: `function reverseString(s) {\n  // your code here\n}\n`,
    },
    tests: [
      { args: ["coach"], expected: "hcaoc" },
      { args: ["a"], expected: "a" },
      { args: [""], expected: "" },
      { args: ["BigRed Hacks"], expected: "skcaH deRgiB", hidden: true },
    ],
    hints: [
      "Strings are sequences. How would you visit the characters from last to first?",
      "You could build a new string by walking an index from the end down to 0.",
      "Python supports slicing with a step (try `s[::-1]`); in JavaScript, think about `split`, `reverse` and `join`.",
    ],
  },
  {
    slug: "fizzbuzz",
    title: "FizzBuzz",
    difficulty: "beginner",
    tags: ["loops", "conditionals"],
    summary: "The classic: multiples of 3 and 5 become words.",
    description: `Return a list of strings for the numbers \`1..n\`:

- multiples of 3 become \`"Fizz"\`
- multiples of 5 become \`"Buzz"\`
- multiples of both become \`"FizzBuzz"\`
- everything else is the number as a string

**Example**

\`\`\`
fizzbuzz(5)  ->  ["1", "2", "Fizz", "4", "Buzz"]
\`\`\``,
    functionName: { python: "fizzbuzz", javascript: "fizzbuzz" },
    starter: {
      python: `def fizzbuzz(n):\n    result = []\n    # your code here\n    return result\n`,
      javascript: `function fizzbuzz(n) {\n  const result = [];\n  // your code here\n  return result;\n}\n`,
    },
    tests: [
      { args: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] },
      { args: [1], expected: ["1"] },
      { args: [15], expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"] },
      { args: [0], expected: [], hidden: true },
    ],
    hints: [
      "Which operator tells you whether one number divides evenly into another?",
      "Order matters: what happens to 15 if you check for 3 before checking for both 3 and 5?",
      "Check `i % 15 == 0` first, then 3, then 5, and fall back to `str(i)` / `String(i)`.",
    ],
  },
  {
    slug: "count-vowels",
    title: "Count the Vowels",
    difficulty: "beginner",
    tags: ["strings", "counting"],
    summary: "Count a, e, i, o and u in a sentence, ignoring case.",
    description: `Return how many vowels (\`a e i o u\`, upper or lower case) appear in the string.

**Example**

\`\`\`
count_vowels("Cornell")      ->  2
count_vowels("rhythm")       ->  0
\`\`\``,
    functionName: { python: "count_vowels", javascript: "countVowels" },
    starter: {
      python: `def count_vowels(text):\n    # your code here\n    pass\n`,
      javascript: `function countVowels(text) {\n  // your code here\n}\n`,
    },
    tests: [
      { args: ["Cornell"], expected: 2 },
      { args: ["rhythm"], expected: 0 },
      { args: ["AEIOU aeiou"], expected: 10 },
      { args: ["Ithaca is Gorges"], expected: 6, hidden: true },
    ],
    hints: [
      "How can you treat 'A' and 'a' the same way before you compare them?",
      "Keep a counter and check each character against a collection of vowels.",
      "Lowercase the text first, then count characters that are `in \"aeiou\"` (or use `\"aeiou\".includes(ch)`).",
    ],
  },
  {
    slug: "palindrome",
    title: "Valid Palindrome",
    difficulty: "intermediate",
    tags: ["strings", "two pointers"],
    summary: "Ignore punctuation and case, then check if it reads the same both ways.",
    description: `A phrase is a palindrome if, after lowercasing it and removing everything that isn't a letter or digit, it reads the same forward and backward.

Return \`true\` / \`True\` if the input is a palindrome.

**Example**

\`\`\`
"A man, a plan, a canal: Panama"  ->  true
"race a car"                      ->  false
\`\`\``,
    functionName: { python: "is_palindrome", javascript: "isPalindrome" },
    starter: {
      python: `def is_palindrome(s):\n    # your code here\n    pass\n`,
      javascript: `function isPalindrome(s) {\n  // your code here\n}\n`,
    },
    tests: [
      { args: ["A man, a plan, a canal: Panama"], expected: true },
      { args: ["race a car"], expected: false },
      { args: [" "], expected: true },
      { args: ["No 'x' in Nixon"], expected: true, hidden: true },
      { args: ["0P"], expected: false, hidden: true },
    ],
    hints: [
      "Break it into two steps: clean the string, then compare. What does 'clean' mean here?",
      "After cleaning, could you compare characters from both ends moving inward?",
      "Keep characters where `ch.isalnum()` (or `/[a-z0-9]/i.test(ch)`), lowercase them, and compare with the reversed version.",
    ],
  },
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "intermediate",
    tags: ["arrays", "hash maps"],
    summary: "Find the two indices whose values add up to a target.",
    description: `Given a list of integers \`nums\` and an integer \`target\`, return the indices \`[i, j]\` (with \`i < j\`) of the two numbers that add up to \`target\`. Exactly one answer exists.

**Example**

\`\`\`
two_sum([2, 7, 11, 15], 9)  ->  [0, 1]
two_sum([3, 2, 4], 6)       ->  [1, 2]
\`\`\`

Can you do better than checking every pair?`,
    functionName: { python: "two_sum", javascript: "twoSum" },
    starter: {
      python: `def two_sum(nums, target):\n    # your code here\n    pass\n`,
      javascript: `function twoSum(nums, target) {\n  // your code here\n}\n`,
    },
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[-4, 10, 5, 1, 9], 5], expected: [0, 4], hidden: true },
    ],
    hints: [
      "For each number, what other number would you need to reach the target?",
      "Checking every pair works but is O(n²). What data structure lets you look up a value instantly?",
      "Walk the list once, storing `value -> index` in a dict/Map; before storing, check whether `target - value` is already there.",
    ],
  },
  {
    slug: "valid-parentheses",
    title: "Balanced Brackets",
    difficulty: "intermediate",
    tags: ["stacks", "strings"],
    summary: "Check that every (, [ and { is closed in the right order.",
    description: `Given a string containing only \`()[]{}\`, return whether the brackets are balanced: every opener is closed by the same type, in the correct order.

**Example**

\`\`\`
"()[]{}"  ->  true
"(]"      ->  false
"([)]"    ->  false
"{[]}"    ->  true
\`\`\``,
    functionName: { python: "is_balanced", javascript: "isBalanced" },
    starter: {
      python: `def is_balanced(s):\n    # your code here\n    pass\n`,
      javascript: `function isBalanced(s) {\n  // your code here\n}\n`,
    },
    tests: [
      { args: ["()[]{}"], expected: true },
      { args: ["(]"], expected: false },
      { args: ["([)]"], expected: false },
      { args: ["{[]}"], expected: true },
      { args: ["(("], expected: false, hidden: true },
      { args: [""], expected: true, hidden: true },
    ],
    hints: [
      "When you see a closing bracket, which opening bracket must it match?",
      "The most recent unmatched opener is the one that must close first. Which data structure is 'last in, first out'?",
      "Push openers onto a stack; on a closer, pop and compare using a map like `{')': '(', ...}`. The stack must be empty at the end.",
    ],
  },
  {
    slug: "longest-unique-substring",
    title: "Longest Unique Substring",
    difficulty: "hard",
    tags: ["strings", "sliding window"],
    summary: "Length of the longest substring with no repeated characters.",
    description: `Return the length of the longest substring of \`s\` that contains no repeating characters.

**Example**

\`\`\`
"abcabcbb"  ->  3   ("abc")
"bbbbb"     ->  1   ("b")
"pwwkew"    ->  3   ("wke")
\`\`\`

Aim for a single pass over the string.`,
    functionName: { python: "longest_unique", javascript: "longestUnique" },
    starter: {
      python: `def longest_unique(s):\n    # your code here\n    pass\n`,
      javascript: `function longestUnique(s) {\n  // your code here\n}\n`,
    },
    tests: [
      { args: ["abcabcbb"], expected: 3 },
      { args: ["bbbbb"], expected: 1 },
      { args: ["pwwkew"], expected: 3 },
      { args: [""], expected: 0, hidden: true },
      { args: ["abba"], expected: 2, hidden: true },
      { args: ["dvdf"], expected: 3, hidden: true },
    ],
    hints: [
      "Imagine a window over the string that only ever contains unique characters. When must it shrink?",
      "Track where you last saw each character. When you see a repeat inside the window, where should the window's left edge jump to?",
      "Keep `left` and a map `last_seen`. For each `right`, if `s[right]` was seen at index ≥ `left`, set `left = last_seen + 1`; then update the best length `right - left + 1`.",
    ],
  },
  {
    slug: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "hard",
    tags: ["arrays", "sorting"],
    summary: "Combine all overlapping [start, end] ranges.",
    description: `Given a list of intervals \`[start, end]\`, merge every overlapping pair and return the result sorted by start. Intervals that touch (\`[1, 4]\` and \`[4, 5]\`) count as overlapping.

**Example**

\`\`\`
[[1,3],[2,6],[8,10],[15,18]]  ->  [[1,6],[8,10],[15,18]]
[[1,4],[4,5]]                 ->  [[1,5]]
\`\`\``,
    functionName: { python: "merge_intervals", javascript: "mergeIntervals" },
    starter: {
      python: `def merge_intervals(intervals):\n    # your code here\n    pass\n`,
      javascript: `function mergeIntervals(intervals) {\n  // your code here\n}\n`,
    },
    tests: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { args: [[[5, 7]]], expected: [[5, 7]] },
      { args: [[[8, 9], [1, 4], [2, 3]]], expected: [[1, 4], [8, 9]], hidden: true },
      { args: [[]], expected: [], hidden: true },
    ],
    hints: [
      "Overlaps are hard to spot in a shuffled list. What could you do first to make neighbours meaningful?",
      "Once sorted by start, you only ever need to compare an interval with the last merged one. When do they overlap?",
      "Sort by start; for each interval, if `start <= merged[-1][1]`, extend `merged[-1][1] = max(...)`, otherwise append it.",
    ],
  },
];

export default challenges;

export const bySlug = new Map(challenges.map((c) => [c.slug, c]));

export function publicChallenge(c, { includeTests = true } = {}) {
  const { tests, hints, ...rest } = c;
  return {
    ...rest,
    hintCount: hints.length,
    testCount: tests.length,
    tests: includeTests
      ? tests.map((t) => (t.hidden ? { hidden: true } : { args: t.args, expected: t.expected }))
      : undefined,
  };
}
