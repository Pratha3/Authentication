/**
 * WhatsApp Notification Service
 *
 * Supports two providers via env config:
 *   WHATSAPP_PROVIDER=twilio  → Twilio WhatsApp API
 *   WHATSAPP_PROVIDER=meta    → Meta Cloud API (WhatsApp Business)
 *   (unset / anything else)   → disabled (no-op)
 *
 * Install the relevant SDK when enabling a provider:
 *   Twilio: npm install twilio
 *   Meta:   uses native fetch (no extra package)
 */

export interface WhatsAppMessageData {
  to: string;             // E.164 format e.g. +919876543210
  type: "confirmation" | "reminder" | "cancellation" | "update";
  eventTitle: string;
  attendeeName: string;
  ticketCode?: string;
  eventDate?: string;
  eventUrl?: string;
}

// ─── Provider: Twilio ─────────────────────────────────────────────────────
async function sendViaTwilio(data: WhatsAppMessageData): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("Twilio credentials missing — WhatsApp skipped");
    return false;
  }

  try {
    // Dynamic import to avoid hard dependency
    const twilio = (await import("twilio" as any)).default;
    const client = twilio(accountSid, authToken);

    const body = buildMessageBody(data);

    await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${data.to}`,
      body,
    });
    return true;
  } catch (err: any) {
    console.error("Twilio WhatsApp error:", err.message);
    return false;
  }
}

// ─── Provider: Meta Cloud API ─────────────────────────────────────────────
async function sendViaMeta(data: WhatsAppMessageData): Promise<boolean> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("Meta WhatsApp credentials missing — skipped");
    return false;
  }

  try {
    const body = buildMessageBody(data);
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: data.to,
          type: "text",
          text: { body },
        }),
      }
    );
    return res.ok;
  } catch (err: any) {
    console.error("Meta WhatsApp error:", err.message);
    return false;
  }
}

// ─── Message body builder ─────────────────────────────────────────────────
function buildMessageBody(data: WhatsAppMessageData): string {
  const appName = "EventSphere";
  switch (data.type) {
    case "confirmation":
      return [
        `✅ *Registration Confirmed!*`,
        `Hi ${data.attendeeName},`,
        `You're registered for *${data.eventTitle}*!`,
        data.ticketCode ? `🎫 Ticket: *${data.ticketCode}*` : "",
        data.eventDate ? `📅 ${data.eventDate}` : "",
        data.eventUrl ? `🔗 ${data.eventUrl}` : "",
        `\n_${appName}_`,
      ].filter(Boolean).join("\n");

    case "reminder":
      return [
        `⏰ *Event Reminder*`,
        `Hi ${data.attendeeName},`,
        `*${data.eventTitle}* is coming up!`,
        data.eventDate ? `📅 ${data.eventDate}` : "",
        data.ticketCode ? `🎫 Ticket: *${data.ticketCode}*` : "",
        data.eventUrl ? `🔗 ${data.eventUrl}` : "",
        `\n_${appName}_`,
      ].filter(Boolean).join("\n");

    case "cancellation":
      return [
        `❌ *Registration Cancelled*`,
        `Hi ${data.attendeeName},`,
        `Your registration for *${data.eventTitle}* has been cancelled.`,
        data.eventUrl ? `Re-register: ${data.eventUrl}` : "",
        `\n_${appName}_`,
      ].filter(Boolean).join("\n");

    case "update":
      return [
        `📢 *Event Update*`,
        `Hi ${data.attendeeName},`,
        `*${data.eventTitle}* has been updated.`,
        data.eventUrl ? `View details: ${data.eventUrl}` : "",
        `\n_${appName}_`,
      ].filter(Boolean).join("\n");
  }
}

// ─── Public API ───────────────────────────────────────────────────────────
export async function sendWhatsApp(data: WhatsAppMessageData): Promise<boolean> {
  if (process.env.NODE_ENV === "test") return true;
  if (!data.to) return false;

  const provider = process.env.WHATSAPP_PROVIDER?.toLowerCase();

  switch (provider) {
    case "twilio": return sendViaTwilio(data);
    case "meta":   return sendViaMeta(data);
    default:
      // No provider configured — silently skip (not an error)
      return false;
  }
}
