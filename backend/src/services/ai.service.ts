import { GoogleGenAI } from "@google/genai";
import { Event } from "../models/Event";

export async function generateGlobalChatReply(
  userMessage: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return "I am currently offline because the GEMINI_API_KEY is not configured on the server.";
  }

  const systemInstruction = `
You are EventSphere Assistant, an intelligent, dynamic, and context-aware event assistant connected directly to the EventSphere application's real data.
Your job is to act as a highly personalized concierge for the user, helping them discover and register for events.

CRITICAL INSTRUCTIONS:
1. ALWAYS analyze the live event data provided in your context below.
2. If the user asks for events (e.g., "tech events", "events near me", "upcoming events"), identify the relevant events from the context automatically.
3. Return the event names, dates, locations, and short descriptions directly in the chat.
4. Format your event recommendations as a numbered list. Example format:
   "1. [Event Name] – [Date], [Location]"
5. After listing the events, ALWAYS end your response by asking if the user would like more details or help registering for any of the events.
6. NEVER tell the user to "manually check the Discover page" or "use the search bar". You are an intelligent assistant; do the searching for them using the provided context.
7. If there are no events matching their query in the context, politely inform them that there are currently no events of that specific type scheduled right now.

Remember: Be conversational, intelligent, and dynamic.
  `.trim();

  try {
    // Fetch live/upcoming events to give the AI real-time context
    const upcomingEvents = await Event.find({ status: { $in: ["upcoming", "live"] } })
      .sort({ startDate: 1 })
      .limit(30)
      .lean();

    let eventContext = "\n\n--- DATABASE CONTEXT ---\n";
    if (upcomingEvents.length > 0) {
      eventContext += "Here is the current list of live and upcoming events in the application database:\n";
      upcomingEvents.forEach(e => {
        eventContext += `- **${e.title}** (Category: ${e.category}, ${e.isFree ? 'Free' : e.currency + ' ' + e.price}). Location: ${e.city || e.address || 'Online/TBA'}. Date: ${new Date(e.startDate).toLocaleString()}. Slug: ${e.slug}\n  Description: ${e.shortDescription || e.description.substring(0, 100) + '...'}\n`;
      });
      eventContext += "\nUse this information to directly answer the user's query about events.";
    } else {
      eventContext += "There are currently ZERO upcoming or live events in the database. If asked, inform the user that no events are scheduled right now.";
    }
    eventContext += "\n------------------------";

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction + eventContext,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't process your request at this time.";
  } catch (error: any) {
    console.error("[AI Service] Error generating reply:", error.message);
    throw new Error("I am experiencing technical difficulties and cannot answer right now.");
  }
}
