import { Router } from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import challenges, { bySlug, publicChallenge } from "../data/challenges.js";
import { Activity, Submission, User } from "../models/index.js";
import { config } from "../config.js";
import { askTutor, tutorEnabled } from "../services/tutor.js";
import { runInDocker } from "../services/runner.js";

const router = Router();

const tutorLimiter = rateLimit({ windowMs: 60_000, limit: 12, message: { error: "The tutor needs a breather. Try again in a minute." } });
const runLimiter = rateLimit({ windowMs: 60_000, limit: 20, message: { error: "Too many runs. Wait a moment and try again." } });

const language = z.enum(["python", "javascript"]);
const code = z.string().max(20000);

const schemas = {
  session: z.object({
    name: z.string().trim().min(2).max(40),
    role: z.enum(["student", "instructor"]).default("student"),
  }),
  run: z.object({ language, code }),
  submit: z.object({
    language,
    code: code.min(1),
    results: z.array(z.object({ passed: z.boolean() })).max(50).optional(),
    runtimeMs: z.number().nonnegative().optional(),
  }),
  hint: z.object({ level: z.number().int().min(0).max(10) }),
  tutor: z.object({
    challenge: z.string(),
    language,
    code,
    lastRun: z.string().max(4000).optional(),
    messages: z
      .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
      .min(1)
      .max(30)
      .refine((m) => m[m.length - 1].role === "user", "Last message must be from the user"),
  }),
};

const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request", details: parsed.error.issues.map((i) => i.message) });
  }
  req.body = parsed.data;
  next();
};

async function currentUser(req, res, next) {
  const id = req.get("x-user-id");
  if (!id || !mongoose.isValidObjectId(id)) return res.status(401).json({ error: "Sign in to continue" });
  req.user = await User.findById(id);
  if (!req.user) return res.status(401).json({ error: "Session expired, please sign in again" });
  next();
}

const instructorOnly = (req, res, next) =>
  req.user.role === "instructor" ? next() : res.status(403).json({ error: "Instructor access required" });

function findChallenge(req, res, next) {
  req.challenge = bySlug.get(req.params.slug);
  if (!req.challenge) return res.status(404).json({ error: "Challenge not found" });
  next();
}

router.get("/config", (req, res) => {
  res.json({ runner: config.runner, tutor: tutorEnabled() });
});

router.post("/session", validate(schemas.session), async (req, res) => {
  const handle = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!handle) return res.status(400).json({ error: "Choose a name with letters or numbers" });
  const user = await User.findOneAndUpdate(
    { handle },
    { $setOnInsert: { name: req.body.name, handle, role: req.body.role } },
    { upsert: true, new: true },
  );
  res.json({ id: user.id, name: user.name, role: user.role });
});

router.get("/challenges", async (req, res) => {
  const list = challenges.map((c) => publicChallenge(c, { includeTests: false }));
  const id = req.get("x-user-id");
  if (id && mongoose.isValidObjectId(id)) {
    const stats = await Submission.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: "$challenge", attempts: { $sum: 1 }, solved: { $max: "$passed" } } },
    ]);
    const byChallenge = new Map(stats.map((s) => [s._id, s]));
    for (const c of list) {
      const s = byChallenge.get(c.slug);
      c.status = s ? (s.solved ? "solved" : "attempted") : "new";
    }
  }
  res.json(list);
});

router.get("/challenges/:slug", findChallenge, (req, res) => {
  res.json(publicChallenge(req.challenge));
});

router.get("/challenges/:slug/tests", findChallenge, (req, res) => {
  if (config.runner !== "browser") return res.status(403).json({ error: "Tests are graded on the server" });
  res.json(req.challenge.tests);
});

router.post("/challenges/:slug/run", runLimiter, findChallenge, validate(schemas.run), async (req, res) => {
  if (config.runner !== "docker") {
    return res.status(503).json({ error: "Server-side execution is disabled", runner: config.runner });
  }
  res.json(await runInDocker(req.challenge, req.body.language, req.body.code));
});

router.post("/challenges/:slug/submit", runLimiter, currentUser, findChallenge, validate(schemas.submit), async (req, res) => {
  const { language, code } = req.body;
  const total = req.challenge.tests.length;
  let results;
  let runtimeMs = req.body.runtimeMs;
  let verified = false;

  if (config.runner === "docker") {
    const run = await runInDocker(req.challenge, language, code);
    results = run.results;
    runtimeMs = run.runtimeMs;
    verified = Boolean(results);
  } else if (config.runner === "browser") {
    results = req.body.results;
  } else {
    return res.status(503).json({ error: "Code execution is disabled on this server" });
  }

  if (results && results.length !== total) {
    return res.status(400).json({ error: "Results don't match this challenge's tests" });
  }
  const passedCount = results ? results.filter((r) => r.passed).length : 0;
  const submission = await Submission.create({
    user: req.user._id,
    challenge: req.challenge.slug,
    language,
    code,
    passed: passedCount === total,
    passedCount,
    total,
    verified,
    runtimeMs,
  });
  res.status(201).json({ submission, results: verified ? results : undefined });
});

router.get("/challenges/:slug/submissions", currentUser, findChallenge, async (req, res) => {
  const items = await Submission.find({ user: req.user._id, challenge: req.challenge.slug })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json(items);
});

router.post("/challenges/:slug/hints", currentUser, findChallenge, validate(schemas.hint), async (req, res) => {
  const { level } = req.body;
  if (level >= req.challenge.hints.length) return res.status(404).json({ error: "No more hints" });
  await Activity.create({ user: req.user._id, challenge: req.challenge.slug, type: "hint", level });
  res.json({ level, hint: req.challenge.hints[level], remaining: req.challenge.hints.length - level - 1 });
});

router.post("/tutor", tutorLimiter, currentUser, validate(schemas.tutor), async (req, res) => {
  const challenge = bySlug.get(req.body.challenge);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });
  if (!tutorEnabled()) {
    return res.status(503).json({ error: "The AI tutor isn't configured on this server. Progressive hints are still available.", offline: true });
  }
  try {
    const reply = await askTutor({ ...req.body, challenge });
    await Activity.create({ user: req.user._id, challenge: challenge.slug, type: "tutor" });
    res.json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Tutor auth failed: check ANTHROPIC_API_KEY");
      return res.status(503).json({ error: "The AI tutor is misconfigured. Hints are still available.", offline: true });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "The tutor is busy right now. Try again in a few seconds." });
    }
    if (err instanceof Anthropic.APIConnectionError || err instanceof Anthropic.InternalServerError) {
      return res.status(502).json({ error: "Couldn't reach the tutor. Try again shortly." });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Tutor API error:", err.status, err.message);
      return res.status(502).json({ error: "The tutor ran into a problem." });
    }
    throw err;
  }
});

router.get("/progress", currentUser, async (req, res) => {
  const subs = await Submission.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  const solved = new Set(subs.filter((s) => s.passed).map((s) => s.challenge));
  const attempted = new Set(subs.map((s) => s.challenge));
  const byDifficulty = {};
  for (const c of challenges) {
    byDifficulty[c.difficulty] ??= { total: 0, solved: 0 };
    byDifficulty[c.difficulty].total += 1;
    if (solved.has(c.slug)) byDifficulty[c.difficulty].solved += 1;
  }
  const days = new Set(subs.map((s) => s.createdAt.toISOString().slice(0, 10)));
  let streak = 0;
  for (let d = new Date(); days.has(d.toISOString().slice(0, 10)); d.setDate(d.getDate() - 1)) streak++;
  const hintsUsed = await Activity.countDocuments({ user: req.user._id, type: "hint" });

  res.json({
    user: { name: req.user.name, role: req.user.role },
    solved: solved.size,
    attempted: attempted.size,
    total: challenges.length,
    submissions: subs.length,
    acceptance: subs.length ? Math.round((subs.filter((s) => s.passed).length / subs.length) * 100) : 0,
    streak,
    hintsUsed,
    byDifficulty,
    solvedSlugs: [...solved],
    recent: subs.slice(0, 8).map((s) => ({
      id: s._id,
      challenge: s.challenge,
      title: bySlug.get(s.challenge)?.title ?? s.challenge,
      language: s.language,
      passed: s.passed,
      passedCount: s.passedCount,
      total: s.total,
      createdAt: s.createdAt,
    })),
  });
});

router.get("/instructor/analytics", currentUser, instructorOnly, async (req, res) => {
  const [perChallenge, activity, students, recent] = await Promise.all([
    Submission.aggregate([
      { $group: {
          _id: { challenge: "$challenge", user: "$user" },
          attempts: { $sum: 1 },
          solved: { $max: "$passed" },
          passes: { $sum: { $cond: ["$passed", 1, 0] } },
      } },
      { $group: {
          _id: "$_id.challenge",
          students: { $sum: 1 },
          solvers: { $sum: { $cond: ["$solved", 1, 0] } },
          attempts: { $sum: "$attempts" },
          passes: { $sum: "$passes" },
      } },
    ]),
    Activity.aggregate([{ $group: { _id: { challenge: "$challenge", type: "$type" }, count: { $sum: 1 } } }]),
    Submission.aggregate([
      { $group: {
          _id: "$user",
          submissions: { $sum: 1 },
          solved: { $addToSet: { $cond: ["$passed", "$challenge", "$$REMOVE"] } },
          last: { $max: "$createdAt" },
      } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $match: { "user.role": "student" } },
      { $sort: { last: -1 } },
    ]),
    Submission.find().sort({ createdAt: -1 }).limit(10).populate("user", "name").lean(),
  ]);

  const counts = new Map(activity.map((a) => [`${a._id.challenge}:${a._id.type}`, a.count]));
  const stats = new Map(perChallenge.map((p) => [p._id, p]));

  res.json({
    totals: {
      students: await User.countDocuments({ role: "student" }),
      submissions: perChallenge.reduce((n, p) => n + p.attempts, 0),
      hints: activity.filter((a) => a._id.type === "hint").reduce((n, a) => n + a.count, 0),
      tutorMessages: activity.filter((a) => a._id.type === "tutor").reduce((n, a) => n + a.count, 0),
    },
    challenges: challenges.map((c) => {
      const s = stats.get(c.slug) ?? { students: 0, solvers: 0, attempts: 0, passes: 0 };
      return {
        slug: c.slug,
        title: c.title,
        difficulty: c.difficulty,
        students: s.students,
        solveRate: s.students ? Math.round((s.solvers / s.students) * 100) : 0,
        avgAttempts: s.students ? +(s.attempts / s.students).toFixed(1) : 0,
        hints: counts.get(`${c.slug}:hint`) ?? 0,
        tutorMessages: counts.get(`${c.slug}:tutor`) ?? 0,
      };
    }),
    students: students.map((s) => ({
      name: s.user.name,
      submissions: s.submissions,
      solved: s.solved.length,
      lastActive: s.last,
    })),
    recent: recent.map((s) => ({
      id: s._id,
      student: s.user?.name ?? "Unknown",
      title: bySlug.get(s.challenge)?.title ?? s.challenge,
      language: s.language,
      passed: s.passed,
      passedCount: s.passedCount,
      total: s.total,
      createdAt: s.createdAt,
    })),
  });
});

export default router;
