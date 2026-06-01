import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { User } from "../src/models/User";
import { Profile, type EventCategory } from "../src/models/Profile";
import { Organizer } from "../src/models/Organizer";
import { Event } from "../src/models/Event";
import { Registration } from "../src/models/Registration";
import { Bookmark } from "../src/models/Bookmark";

const password = "DemoPass123!";
const passwordHashPromise = bcrypt.hash(password, 12);

const demoUsers = [
  {
    email: "demo.organizer@example.com",
    name: "Demo Organizer",
    role: "organizer" as const,
    organizationName: "EventSphere Demo Org",
    interests: ["tech", "business"] as EventCategory[],
  },
  {
    email: "city.club@example.com",
    name: "City Club Events",
    role: "organizer" as const,
    organizationName: "City Club Events",
    interests: ["music", "food", "art"] as EventCategory[],
  },
  {
    email: "runner.user@example.com",
    name: "Riya Runner",
    role: "user" as const,
    interests: ["marathon", "wellness", "outdoor"] as EventCategory[],
  },
  {
    email: "tech.user@example.com",
    name: "Aarav Techie",
    role: "user" as const,
    interests: ["tech", "business", "workshop"] as EventCategory[],
  },
  {
    email: "food.user@example.com",
    name: "Meera Foodie",
    role: "user" as const,
    interests: ["food", "community", "cafe"] as EventCategory[],
  },
];

const eventTemplates = [
  {
    organizerEmail: "demo.organizer@example.com",
    title: "Ahmedabad Tech Meetup",
    slug: "seed-ahmedabad-tech-meetup",
    description: "A practical meetup for developers, founders, and product builders to share ideas and demos.",
    shortDescription: "Developers, founders, and product builders.",
    category: "tech",
    tags: ["tech", "startup", "networking"],
    city: "Ahmedabad",
    address: "CG Road Innovation Hub",
    capacity: 80,
    isFeatured: true,
  },
  {
    organizerEmail: "demo.organizer@example.com",
    title: "Startup Pitch Evening",
    slug: "seed-startup-pitch-evening",
    description: "Early-stage founders pitch ideas, meet mentors, and connect with local operators.",
    shortDescription: "Pitch ideas and meet startup mentors.",
    category: "business",
    tags: ["startup", "pitch", "business"],
    city: "Ahmedabad",
    address: "Riverfront Business Center",
    capacity: 60,
    isFeatured: true,
  },
  {
    organizerEmail: "city.club@example.com",
    title: "Indie Music Night",
    slug: "seed-indie-music-night",
    description: "An intimate evening of live indie music, local performers, and community energy.",
    shortDescription: "Live indie music with local performers.",
    category: "music",
    tags: ["music", "live", "community"],
    city: "Mumbai",
    address: "Kala Ghoda Studio",
    capacity: 120,
    isFeatured: true,
  },
  {
    organizerEmail: "city.club@example.com",
    title: "Old City Food Walk",
    slug: "seed-old-city-food-walk",
    description: "Explore local food lanes, hidden cafes, and classic street snacks with a guided group.",
    shortDescription: "A guided walk through local food lanes.",
    category: "food",
    tags: ["food", "walk", "community"],
    city: "Ahmedabad",
    address: "Manek Chowk",
    capacity: 30,
    isFeatured: false,
  },
  {
    organizerEmail: "demo.organizer@example.com",
    title: "Sunday Wellness Run",
    slug: "seed-sunday-wellness-run",
    description: "A beginner-friendly community run focused on wellness, consistency, and fresh morning air.",
    shortDescription: "Beginner-friendly community run.",
    category: "marathon",
    tags: ["run", "wellness", "outdoor"],
    city: "Pune",
    address: "University Road",
    capacity: 200,
    isFeatured: false,
  },
] satisfies Array<{
  organizerEmail: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: EventCategory;
  tags: string[];
  city: string;
  address: string;
  capacity: number;
  isFeatured: boolean;
}>;

function futureDate(days: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function upsertUser(userSeed: typeof demoUsers[number], passwordHash: string) {
  const user = await User.findOneAndUpdate(
    { email: userSeed.email },
    {
      $setOnInsert: {
        email: userSeed.email,
        password: passwordHash,
        name: userSeed.name,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await Profile.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        email: userSeed.email,
        fullName: userSeed.name,
        role: userSeed.role,
        interests: userSeed.interests,
        isActive: true,
      },
      $setOnInsert: {
        userId: user._id,
      },
    },
    { upsert: true }
  );

  return user;
}

async function main(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);

  const passwordHash = await passwordHashPromise;
  const usersByEmail = new Map<string, Awaited<ReturnType<typeof upsertUser>>>();

  for (const userSeed of demoUsers) {
    const user = await upsertUser(userSeed, passwordHash);
    usersByEmail.set(userSeed.email, user);
  }

  const organizersByEmail = new Map<string, mongoose.HydratedDocument<unknown>>();
  for (const userSeed of demoUsers.filter((user) => user.role === "organizer")) {
    const user = usersByEmail.get(userSeed.email);
    if (!user) continue;

    const organizer = await Organizer.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          organizationName: userSeed.organizationName,
          description: `${userSeed.organizationName} creates demo events for testing local discovery flows.`,
          verificationStatus: "approved",
          verifiedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    organizersByEmail.set(userSeed.email, organizer);
  }

  const createdEvents: mongoose.HydratedDocument<unknown>[] = [];
  for (const [index, eventSeed] of eventTemplates.entries()) {
    const organizer = organizersByEmail.get(eventSeed.organizerEmail);
    if (!organizer) continue;

    const startDate = futureDate(7 + index * 3, 10 + (index % 4) * 2);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 2);

    const event = await Event.findOneAndUpdate(
      { slug: eventSeed.slug },
      {
        $set: {
          organizerId: organizer._id,
          title: eventSeed.title,
          slug: eventSeed.slug,
          description: eventSeed.description,
          shortDescription: eventSeed.shortDescription,
          category: eventSeed.category,
          tags: eventSeed.tags,
          status: "upcoming",
          startDate,
          endDate,
          timezone: "Asia/Kolkata",
          isOnline: false,
          city: eventSeed.city,
          state: "Gujarat",
          country: "India",
          latitude: 23.0225 + index * 0.02,
          longitude: 72.5714 + index * 0.02,
          capacity: eventSeed.capacity,
          price: 0,
          currency: "INR",
          isFree: true,
          isFeatured: eventSeed.isFeatured,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    createdEvents.push(event);
  }

  const attendeeEmails = ["runner.user@example.com", "tech.user@example.com", "food.user@example.com"];
  for (const [index, event] of createdEvents.entries()) {
    const attendeeEmail = attendeeEmails[index % attendeeEmails.length];
    const attendee = usersByEmail.get(attendeeEmail);
    if (!attendee) continue;

    await Registration.findOneAndUpdate(
      { eventId: event._id, userId: attendee._id },
      {
        $setOnInsert: {
          eventId: event._id,
          userId: attendee._id,
          status: "confirmed",
          attendeeDetails: {
            phone: "+919999999999",
            answers: {
              registrationName: attendee.name ?? attendeeEmail,
              registrationEmail: attendeeEmail,
            },
          },
        },
      },
      { upsert: true }
    );

    await Bookmark.updateOne(
      { eventId: event._id, userId: attendee._id },
      { $setOnInsert: { eventId: event._id, userId: attendee._id } },
      { upsert: true }
    );
  }

  console.log("Seed complete.");
  console.log(`Password for all demo accounts: ${password}`);
  console.table(demoUsers.map((user) => ({
    email: user.email,
    role: user.role,
    name: user.name,
  })));
  console.log(`Events ready: ${createdEvents.length}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
