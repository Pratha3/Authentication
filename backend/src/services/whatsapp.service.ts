/**
 * WhatsApp Notification Service
 *
 * Provider is selected via WHATSAPP_PROVIDER env var:
 *   "twilio"  → Twilio WhatsApp API  (twilio npm package — already installed)
 *   "meta"    → Meta Cloud API       (uses native fetch, no extra package)
 *   unset     → notifications silently skipped (no error)
 *
 * Quick start (Twilio sandbox):
 *   1. Sign up at console.twilio.com
 *   2. Messaging → Try it out → Send a WhatsApp message
 *   3. From your phone: WhatsApp → +14155238886 → "join <keyword>"
 *   4. Set env vars and restart the backend
 */

import twilio from "twilio";

export interface WhatsAppMessage {
  to: string;           // E.164 format: +919876543210
  type: "confirmation" | "reminder" | "cancellation" | "update";
  eventTitle: string;
  attendeeName: string;
  ticketCode?: string;
  eventDate?: string;
  eventUrl?: string;
}

// ─── Twilio ───────────────────────────────────────────────────────────────────
async function sendViaTwilio(msg: WhatsAppMessage): Promise<boolean> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  if (!sid || !token || !from) {
    console.warn("[WhatsApp] Twilio env vars missing — message skipped");
    return false;
  }

  // Normalise: ensure the number has whatsapp: prefix
  const to = msg.to.startsWith("whatsapp:") ? msg.to : `whatsapp:${msg.to}`;

  try {
    const client = twilio(sid, token);
    await client.messages.create({
      from,
      to,
      body: buildBody(msg),
    });
    console.log(`[WhatsApp] ✅ Sent ${msg.type} to ${msg.to}`);
    return true;
  } catch (err: any) {
    console.error("[WhatsApp] Twilio error:", err.message);
    return false;
  }
}

// ─── Meta Cloud API ───────────────────────────────────────────────────────────
async function sendViaMeta(msg: WhatsAppMessage): Promise<boolean> {
  const token       = process.env.META_WHATSAPP_TOKEN;
  const phoneNumId  = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumId) {
    console.warn("[WhatsApp] Meta env vars missing — message skipped");
    return false;
  }

  // Strip whatsapp: prefix if present; Meta API expects plain E.164
  const to = msg.to.replace(/^whatsapp:/, "");

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: buildBody(msg) },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[WhatsApp] Meta API error:", JSON.stringify(err));
      return false;
    }

    console.log(`[WhatsApp] ✅ Sent ${msg.type} via Meta to ${to}`);
    return true;
  } catch (err: any) {
    console.error("[WhatsApp] Meta fetch error:", err.message);
    return false;
  }
}

// ─── Message body ─────────────────────────────────────────────────────────────
function buildBody(msg: WhatsAppMessage): string {
  const app = "EventSphere";
  const lines: string[] = [];

  switch (msg.type) {
    case "confirmation":
      lines.push(
        `✅ *Registration Confirmed!*`,
        `Hi ${msg.attendeeName} 👋`,
        `You're registered for *${msg.eventTitle}*!`,
        ...(msg.ticketCode ? [`🎫 Ticket Code: *${msg.ticketCode}*`] : []),
        ...(msg.eventDate  ? [`📅 ${msg.eventDate}`] : []),
        ...(msg.eventUrl   ? [`🔗 ${msg.eventUrl}`] : []),
        `\n_${app}_`
      );
      break;

    case "reminder":
      lines.push(
        `⏰ *Event Reminder*`,
        `Hi ${msg.attendeeName},`,
        `*${msg.eventTitle}* is coming up — don't forget!`,
        ...(msg.eventDate  ? [`📅 ${msg.eventDate}`] : []),
        ...(msg.ticketCode ? [`🎫 Ticket: *${msg.ticketCode}*`] : []),
        ...(msg.eventUrl   ? [`🔗 ${msg.eventUrl}`] : []),
        `\n_${app}_`
      );
      break;

    case "cancellation":
      lines.push(
        `❌ *Registration Cancelled*`,
        `Hi ${msg.attendeeName},`,
        `Your registration for *${msg.eventTitle}* has been cancelled.`,
        ...(msg.eventUrl ? [`Re-register anytime: ${msg.eventUrl}`] : []),
        `\n_${app}_`
      );
      break;

    case "update":
      lines.push(
        `📢 *Event Update*`,
        `Hi ${msg.attendeeName},`,
        `There's an update for *${msg.eventTitle}*.`,
        ...(msg.eventUrl ? [`View details: ${msg.eventUrl}`] : []),
        `\n_${app}_`
      );
      break;
  }

  return lines.join("\n");
}

// ─── Public send function ─────────────────────────────────────────────────────
export async function sendWhatsApp(msg: WhatsAppMessage): Promise<boolean> {
  if (process.env.NODE_ENV === "test") return true; // skip in tests
  if (!msg.to) return false;

  const provider = (process.env.WHATSAPP_PROVIDER ?? "").toLowerCase();

  switch (provider) {
    case "twilio": return sendViaTwilio(msg);
    case "meta":   return sendViaMeta(msg);
    default:
      return false; // silently disabled
  }
}
