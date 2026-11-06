import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

process.env.MONGODB_URI = "";
process.env.ANTHROPIC_API_KEY = "";
process.env.CODE_RUNNER = "browser";

const { connectDb, disconnectDb } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");

let app;
let student;
let instructor;

before(async () => {
  await connectDb();
  app = createApp();
  student = (await request(app).post("/api/session").send({ name: "Test Student" })).body;
  instructor = (await request(app).post("/api/session").send({ name: "Test Prof", role: "instructor" })).body;
});

after(disconnectDb);

test("lists eight challenges across three difficulties", async () => {
  const res = await request(app).get("/api/challenges").expect(200);
  assert.equal(res.body.length, 8);
  assert.deepEqual(new Set(res.body.map((c) => c.difficulty)), new Set(["beginner", "intermediate", "hard"]));
  assert.ok(res.body.every((c) => !c.hints));
});

test("challenge detail hides hidden test cases", async () => {
  const res = await request(app).get("/api/challenges/two-sum").expect(200);
  const hidden = res.body.tests.filter((t) => t.hidden);
  assert.ok(hidden.length > 0);
  assert.ok(hidden.every((t) => t.args === undefined));
});

test("hints are progressive and need a session", async () => {
  await request(app).post("/api/challenges/fizzbuzz/hints").send({ level: 0 }).expect(401);
  const first = await request(app).post("/api/challenges/fizzbuzz/hints").set("x-user-id", student.id).send({ level: 0 }).expect(200);
  assert.equal(first.body.remaining, 2);
  await request(app).post("/api/challenges/fizzbuzz/hints").set("x-user-id", student.id).send({ level: 3 }).expect(404);
});

test("submissions are validated and update progress", async () => {
  await request(app).post("/api/challenges/fizzbuzz/submit").set("x-user-id", student.id)
    .send({ language: "ruby", code: "x" }).expect(400);
  await request(app).post("/api/challenges/fizzbuzz/submit").set("x-user-id", student.id)
    .send({ language: "python", code: "x", results: [{ passed: true }] }).expect(400);
  const ok = await request(app).post("/api/challenges/fizzbuzz/submit").set("x-user-id", student.id)
    .send({ language: "python", code: "def fizzbuzz(n): ...", results: Array(4).fill({ passed: true }) }).expect(201);
  assert.equal(ok.body.submission.passed, true);
  const progress = await request(app).get("/api/progress").set("x-user-id", student.id).expect(200);
  assert.equal(progress.body.solved, 1);
});

test("tutor reports offline without an API key", async () => {
  const res = await request(app).post("/api/tutor").set("x-user-id", student.id)
    .send({ challenge: "two-sum", language: "python", code: "", messages: [{ role: "user", content: "help" }] }).expect(503);
  assert.equal(res.body.offline, true);
});

test("instructor analytics are restricted", async () => {
  await request(app).get("/api/instructor/analytics").set("x-user-id", student.id).expect(403);
  const res = await request(app).get("/api/instructor/analytics").set("x-user-id", instructor.id).expect(200);
  assert.equal(res.body.challenges.length, 8);
});
