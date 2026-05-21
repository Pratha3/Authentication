import { GoogleGenAI } from "@google/genai";

export async function generateEventChatReply(
  eventDetails: any,
  userMessage: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return "I am currently offline because the GEMINI_API_KEY is not configured on the server.";
  }

  const systemInstruction = `
You are a helpful, polite, and enthusiastic event assistant for the event "${eventDetails.title}".
Use the following details to answer the user's question accurately.
If the answer is not in the details, politely inform the user that you don't have that specific information.
Keep your answers concise and conversational. Do not use markdown unless necessary for formatting (e.g., bolding).

Event Details:
- Title: ${eventDetails.title}
- Description: ${eventDetails.description || "N/A"}
- Date: ${eventDetails.startDate} to ${eventDetails.endDate}
- Venue: ${eventDetails.venueId?.name || "N/A"}, ${eventDetails.venueId?.city || "N/A"}
- Price: ${eventDetails.price === 0 ? "Free" : `${eventDetails.currency} ${eventDetails.price}`}
- Capacity: ${eventDetails.capacity || "Unlimited"}
- Current Attendees: ${eventDetails.currentAttendees}
- Status: ${eventDetails.status}
  `.trim();

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't process your request at this time.";
  } catch (error: any) {
    console.error("[AI Service] Error generating reply:", error.message);
    return "I am experiencing technical difficulties and cannot answer right now.";
  }
}
