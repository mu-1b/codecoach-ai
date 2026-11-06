import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

const SYSTEM_PROMPT = `You are CodeCoach, a patient programming tutor for students working through coding challenges.

Teach with the Socratic method:
- Guide the student to the answer with one or two focused questions instead of giving it to them.
- Refer to specific lines or ideas in their current code when you can.
- Never write the full solution or a complete function body, even if asked directly. If they insist, explain that working it out is the point and offer a smaller next step.
- Short snippets that illustrate general syntax (not the challenge's solution) are fine.
- If their code has a bug, point them toward where to look and ask what they expect to happen there.
- When they get something right, say so briefly and specifically.

Keep replies under 120 words, warm and encouraging. Use Markdown and backticks for code.`;

let client;

export function tutorEnabled() {
  return Boolean(config.anthropicKey);
}

function getClient() {
  client ??= new Anthropic({ apiKey: config.anthropicKey });
  return client;
}

function contextBlock({ challenge, language, code, lastRun }) {
  const parts = [
    `<challenge title="${challenge.title}" difficulty="${challenge.difficulty}">\n${challenge.description}\n</challenge>`,
    `<student_code language="${language}">\n${code || "(empty)"}\n</student_code>`,
  ];
  if (lastRun) parts.push(`<last_run>\n${lastRun}\n</last_run>`);
  return parts.join("\n\n");
}

export async function askTutor({ challenge, language, code, lastRun, messages }) {
  const history = messages.slice(0, -1);
  const latest = messages[messages.length - 1];

  const response = await getClient().beta.messages.create({
    model: config.model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [
      ...history,
      {
        role: "user",
        content: `${contextBlock({ challenge, language, code, lastRun })}\n\n${latest.content}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    return "I can't help with that one. Let's get back to the challenge: what part of your code are you least sure about?";
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
  return text || "Let's think about it step by step. What do you expect your function to return for the first example?";
}
