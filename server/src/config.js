import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || "",
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
  runner: ["browser", "docker", "disabled"].includes(process.env.CODE_RUNNER)
    ? process.env.CODE_RUNNER
    : "browser",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
