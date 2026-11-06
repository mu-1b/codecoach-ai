import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { seedIfEmpty } from "./seed.js";
import { tutorEnabled } from "./services/tutor.js";

await connectDb();
await seedIfEmpty();

createApp().listen(config.port, () => {
  console.log(`CodeCoach API on http://localhost:${config.port}`);
  console.log(`Code runner: ${config.runner} | AI tutor: ${tutorEnabled() ? "enabled" : "disabled (no ANTHROPIC_API_KEY)"}`);
});
