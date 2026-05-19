/**
 * WhatsApp Notification Service — Meta Cloud API
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 *
 * Required env vars:
 *   META_WHATSAPP_TOKEN     — Permanent System User access token
 *   META_PHONE_NUMBER_ID    — Phone Number ID from Meta dashboard
 *
 * Important:
 *   • During development, Meta provides a test number you can use freely.
 *   • In production, first-contact outbound messages must use pre-approved
 *     templates (HSM). Messages sent within 24 h of a user replying are free-form.
 *   • First 1,000 business-initiated conversations per month are free.
 */

const META_API_VERSION = "v20.0";
const META_API_BASE = "https://graph.facebook.com";

export interface WhatsAppMessage {
  to: string;
  type: "confirmation" | "reminder" | "cancellation" | "update" | "organizer_alert";
  eventTitle: string;
  attendeeName: string;
  ticketCode?: string;
  eventDate?: string;
  eventUrl?: string;
  attendeeCount?: number;
}

interface MetaTextPayload {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: { body: string };
}

interface MetaApiSuccess {
  messages: Array<{ id: string }>;
}

interface MetaApiError {
  error: { message: string; code: number; type: string };
}

// ── Message body builder ──────────────────────────────────────────────────────

function buildBody(msg: WhatsAppMessage): string {
  const APP = "EventSphere";
  const lines: string[] = [];

  switch (msg.type) {
    case "confirmation":
      lines.push(
        "✅ *Registration Confirmed!*",
        `Hi ${msg.attendeeName} 👋`,
        `You're registered for *${msg.eventTitle}*!`,
        ...(msg.ticketCode ? [`🎫 Ticket: *${msg.ticketCode}*`] : []),
        ...(msg.eventDate  ? [`📅 ${msg.eventDate}`]            : []),
        ...(msg.eventUrl   ? [`🔗 ${msg.eventUrl}`]             : []),
        `\n_${APP}_`
      );
      break;

    case "reminder":
      lines.push(
        "⏰ *Event Reminder*",
        `Hi ${msg.attendeeName},`,
        `*${msg.eventTitle}* is coming up!`,
        ...(msg.eventDate  ? [`📅 ${msg.eventDate}`]            : []),
        ...(msg.ticketCode ? [`🎫 Ticket: *${msg.ticketCode}*`] : []),
        ...(msg.eventUrl   ? [`🔗 ${msg.eventUrl}`]             : []),
        `\n_${APP}_`
      );
      break;

    case "cancellation":
      lines.push(
        "❌ *Registration Cancelled*",
        `Hi ${msg.attendeeName},`,
        `Your spot for *${msg.eventTitle}* has been cancelled.`,
        ...(msg.eventUrl ? [`Re-register: ${msg.eventUrl}`] : []),
        `\n_${APP}_`
      );
      break;

    case "update":
      lines.push(
        "📢 *Event Update*",
        `Hi ${msg.attendeeName},`,
        `Update for *${msg.eventTitle}*.`,
        ...(msg.eventUrl ? [`Details: ${msg.eventUrl}`] : []),
        `\n_${APP}_`
      );
      break;

    case "organizer_alert":
      lines.push(
        "🔔 *New Registration!*",
        `*${msg.eventTitle}*`,
        `${msg.attendeeName} just registered.`,
        ...(msg.attendeeCount !== undefined
          ? [`👥 Total attendees: *${msg.attendeeCount}*`]
          : []),
        ...(msg.eventUrl ? [`📊 ${msg.eventUrl}`] : []),
        `\n_${APP}_`
      );
      break;
  }

  return lines.join("\n");
}

// ── Meta Cloud API sender ─────────────────────────────────────────────────────

export async function sendWhatsApp(msg: WhatsAppMessage): Promise<boolean> {
  if (process.env.NODE_ENV === "test") return true;
  if (!msg.to) return false;

  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn(
      "[WhatsApp/Meta] Missing env vars — set META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID"
    );
    return false;
  }

  // Meta expects E.164 without any prefix (e.g. "919876543210", not "+91...")
  const to = msg.to.replace(/^\+/, "");

  const payload: MetaTextPayload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: buildBody(msg) },
  };

  try {
    const res = await fetch(
      `${META_API_BASE}/${META_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await res.json()) as MetaApiSuccess | MetaApiError;

    if (!res.ok) {
      const err = data as MetaApiError;
      console.error(
        `[WhatsApp/Meta] ❌ Failed to send to ${msg.to} — ${err.error?.message} (code ${err.error?.code})`
      );
      return false;
    }

    const success = data as MetaApiSuccess;
    const messageId = success.messages?.[0]?.id ?? "unknown";
    console.log(`[WhatsApp/Meta] ✅ Sent to ${msg.to} — message ID: ${messageId}`);
    return true;
  } catch (err: any) {
    console.error(`[WhatsApp/Meta] ❌ Network error sending to ${msg.to}:`, err.message);
    return false;
  }
}
