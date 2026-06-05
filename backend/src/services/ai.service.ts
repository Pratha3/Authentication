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

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

function isSimilar(w1: string, w2: string): boolean {
  if (w1.includes(w2) || w2.includes(w1)) return true;
  if (w1[0] !== w2[0]) return false;
  
  const distance = levenshteinDistance(w1, w2);
  const maxLen = Math.max(w1.length, w2.length);
  
  const chars1 = w1.split("");
  const chars2 = w2.split("");
  let overlap = 0;
  for (const char of chars1) {
    const idx = chars2.indexOf(char);
    if (idx !== -1) {
      overlap++;
      chars2.splice(idx, 1);
    }
  }
  
  if (overlap < maxLen * 0.75) return false;
  
  if (maxLen <= 3) return distance === 0;
  return distance <= 2;
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

  if (directWords.length === 0) return true;

  const haystackWords = haystack.split(/\W+/).filter((w) => w.length > 2);

  return directWords.some((qWord) => 
    haystackWords.some((hWord) => isSimilar(qWord, hWord))
  );
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
