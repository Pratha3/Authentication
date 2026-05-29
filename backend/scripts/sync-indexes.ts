import mongoose from "mongoose";
import { env } from "../src/config/env";
import "../src/models/User";
import "../src/models/Profile";
import "../src/models/Organizer";
import "../src/models/Venue";
import "../src/models/Event";
import "../src/models/Registration";
import "../src/models/Bookmark";
import "../src/models/Notification";
import "../src/models/NotificationLog";

async function main(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);

  for (const modelName of mongoose.modelNames()) {
    const model = mongoose.model(modelName);
    await model.syncIndexes();
    console.log(`Synced indexes for ${modelName}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Failed to sync indexes:", error);
  await mongoose.disconnect();
  process.exit(1);
});
