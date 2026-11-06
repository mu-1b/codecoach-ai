import { fileURLToPath } from "node:url";
import challenges from "./data/challenges.js";
import { Activity, Submission, User } from "./models/index.js";

const STUDENTS = ["Maya Chen", "Jordan Lee", "Priya Patel", "Sam Okafor", "Elena Ruiz", "Noah Kim"];
const DAY = 86_400_000;

function random(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export async function seedDemoData() {
  await Promise.all([User.deleteMany({}), Submission.deleteMany({}), Activity.deleteMany({})]);
  const rand = random(42);

  await User.create({ name: "Prof. Rivera", handle: "prof-rivera", role: "instructor" });
  await User.create({ name: "Demo Student", handle: "demo-student", role: "student" });

  const submissions = [];
  const activity = [];
  for (const [i, name] of STUDENTS.entries()) {
    const user = await User.create({ name, handle: name.toLowerCase().replace(/\s+/g, "-") });
    const reach = 5 + Math.floor(rand() * 4);
    for (const c of challenges.slice(0, reach)) {
      const passRate = { beginner: 0.9, intermediate: 0.7, hard: 0.4 }[c.difficulty];
      const attempts = 1 + Math.floor(rand() * 4);
      let t = Date.now() - Math.floor(rand() * 6 * DAY);
      for (let a = 0; a < attempts; a++) {
        const passed = a === attempts - 1 ? rand() < passRate : false;
        const total = c.tests.length;
        submissions.push({
          user: user._id,
          challenge: c.slug,
          language: rand() < 0.6 ? "python" : "javascript",
          code: "# demo submission",
          passed,
          passedCount: passed ? total : Math.floor(rand() * total),
          total,
          verified: false,
          runtimeMs: 20 + Math.floor(rand() * 200),
          createdAt: new Date(t),
        });
        if (rand() < 0.5) activity.push({ user: user._id, challenge: c.slug, type: "hint", level: a, createdAt: new Date(t - 60_000) });
        if (rand() < 0.4) activity.push({ user: user._id, challenge: c.slug, type: "tutor", createdAt: new Date(t - 30_000) });
        t += 5 * 60_000;
      }
    }
  }
  await Submission.insertMany(submissions);
  await Activity.insertMany(activity);
  return { students: STUDENTS.length, submissions: submissions.length };
}

export async function seedIfEmpty() {
  if (await User.estimatedDocumentCount()) return;
  const result = await seedDemoData();
  console.log(`Seeded demo data: ${result.students} students, ${result.submissions} submissions`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { connectDb, disconnectDb } = await import("./db.js");
  await connectDb();
  console.log(await seedDemoData());
  await disconnectDb();
}
