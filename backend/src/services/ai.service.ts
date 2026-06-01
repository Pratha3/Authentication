import { GoogleGenAI } from "@google/genai";
import { Event } from "../models/Event";

type EventSummary = {
  title: string;
  category: string;
  city: string | null;
  address: string | null;
  startDate: Date;
  slug: string;
  shortDescription?: string | null;
  description: string;
  isFree: boolean;
  price: number;
  currency: string;
};

const testDataPattern = /(smoke|quality)\s/i;

function isTestEvent(event: Pick<EventSummary, "title" | "slug">): boolean {
  return event.slug.startsWith("smoke-") ||
    event.slug.startsWith("quality-") ||
    event.slug.startsWith("seed-smoke-") ||
    testDataPattern.test(event.title);
}

function eventDate(date: Date): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventLocation(event: EventSummary): string {
  return event.city || event.address || "Online/TBA";
}

function eventDescription(event: EventSummary): string {
  const text = event.shortDescription || event.description;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function matchesQuery(event: EventSummary, message: string): boolean {
  const query = message.toLowerCase();
  const haystack = [
    event.title,
    event.category,
    event.city,
    event.address,
    event.shortDescription,
    event.description,
    event.slug,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const directWords = query
    .split(/\W+/)
    .filter((word) => word.length > 2 && !["show", "event", "events", "near", "find", "tell", "about"].includes(word));

  return directWords.length === 0 || directWords.some((word) => haystack.includes(word));
}

function buildLocalReply(message: string, events: EventSummary[]): string {
  if (events.length === 0) {
    return "I could not find any upcoming events matching that request right now. Try asking for tech, music, food, business, wellness, or city-based events.";
  }

  const matches = events.filter((event) => matchesQuery(event, message)).slice(0, 6);
  const selected = matches.length > 0 ? matches : events.slice(0, 6);

  const lines = selected.map((event, index) => {
    const price = event.isFree ? "Free" : `${event.currency} ${event.price}`;
    return `${index + 1}. **${event.title}** - ${eventDate(event.startDate)}, ${eventLocation(event)}\n   ${eventDescription(event)}\n   Price: ${price}`;
  });

  return `Here are the best matching events I found:\n\n${lines.join("\n\n")}\n\nWould you like more details or help registering for any of these events?`;
}

async function getUpcomingEvents(): Promise<EventSummary[]> {
  const events = await Event.find({
    status: { $in: ["upcoming", "live"] },
    startDate: { $gte: new Date() },
  })
    .sort({ startDate: 1 })
    .limit(60)
    .lean<EventSummary[]>();

  return events.filter((event) => !isTestEvent(event)).slice(0, 30);
}

function buildEventContext(events: EventSummary[]): string {
  if (events.length === 0) {
    return "There are currently no upcoming or live non-test events in the database.";
  }

  return events.map((event) => {
    const price = event.isFree ? "Free" : `${event.currency} ${event.price}`;
    return [
      `Title: ${event.title}`,
      `Category: ${event.category}`,
      `Date: ${eventDate(event.startDate)}`,
      `Location: ${eventLocation(event)}`,
      `Price: ${price}`,
      `Slug: ${event.slug}`,
      `Description: ${eventDescription(event)}`,
    ].join("\n");
  }).join("\n\n");
}

export async function generateGlobalChatReply(userMessage: string): Promise<string> {
  const message = userMessage.trim();
  const upcomingEvents = await getUpcomingEvents();

  if (!process.env.GEMINI_API_KEY) {
    return buildLocalReply(message, upcomingEvents);
  }

  const systemInstruction = `
You are EventSphere Assistant, a concise event discovery assistant.

Use only the event data in DATABASE CONTEXT. Ignore any event that appears to be test or smoke data.
When the user asks for events, recommend matching events directly with name, date, location, short description, and price.
Format event recommendations as a numbered Markdown list.
If no events match, say that clearly and suggest nearby categories the user can ask for.
Never tell the user to manually check the Discover page.
End event recommendation replies by asking whether the user wants more details or help registering.

DATABASE CONTEXT:
${buildEventContext(upcomingEvents)}
`.trim();

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    return response.text || buildLocalReply(message, upcomingEvents);
  } catch (error) {
    const err = error as { message?: string };
    console.error("[AI Service] Gemini failed, using local fallback:", err.message);
    return buildLocalReply(message, upcomingEvents);
  }
}
