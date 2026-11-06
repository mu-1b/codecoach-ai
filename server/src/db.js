import mongoose from "mongoose";
import { config } from "./config.js";

let memoryServer;

export async function connectDb() {
  let uri = config.mongoUri;
  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri("codecoach");
    console.log("MONGODB_URI not set, using in-memory MongoDB (data resets on restart)");
  }
  await mongoose.connect(uri);
  return uri;
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
