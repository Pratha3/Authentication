import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { User } from "../src/models/User";
import { Profile } from "../src/models/Profile";
import { Organizer } from "../src/models/Organizer";
import { Event } from "../src/models/Event";

const demoEmail = "demo.organizer@example.com";
const demoPassword = "DemoPass123!";

async function main(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);

  let user = await User.findOne({ email: demoEmail });
  if (!user) {
    user = await User.create({
      email: demoEmail,
      password: await bcrypt.hash(demoPassword, 12),
      name: "Demo Organizer",
    });
    console.log(`Created demo user: ${demoEmail}`);
  } else {
    console.log(`Demo user already exists: ${demoEmail}`);
  }

  await Profile.updateOne(
    { userId: user._id },
    {
      $setOnInsert: {
        userId: user._id,
        email: demoEmail,
        fullName: "Demo Organizer",
        role: "organizer",
        interests: ["tech", "business"],
      },
    },
    { upsert: true }
  );

  const organizer = await Organizer.findOneAndUpdate(
    { userId: user._id },
    {
      $setOnInsert: {
        userId: user._id,
        organizationName: "EventSphere Demo Org",
        description: "Demo organizer account for local development.",
        verificationStatus: "approved",
        verifiedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 14);
  startDate.setHours(18, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(20, 0, 0, 0);

  await Event.updateOne(
    { slug: "demo-tech-meetup" },
    {
      $setOnInsert: {
        organizerId: organizer._id,
        title: "Demo Tech Meetup",
        slug: "demo-tech-meetup",
        description: "A seeded event for testing discovery, registration, and organizer dashboards.",
        shortDescription: "Seeded local demo event.",
        category: "tech",
        tags: ["demo", "tech"],
        status: "upcoming",
        startDate,
        endDate,
        timezone: "Asia/Kolkata",
        isOnline: false,
        city: "Ahmedabad",
        state: "Gujarat",
        country: "India",
        latitude: 23.0225,
        longitude: 72.5714,
        capacity: 50,
        price: 0,
        currency: "INR",
        isFree: true,
        isFeatured: true,
      },
    },
    { upsert: true }
  );

  console.log("Seed complete.");
  console.log(`Demo login: ${demoEmail} / ${demoPassword}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
