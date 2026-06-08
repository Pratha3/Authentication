/**
 * SMS Notification Service
 *
 * SMS_PROVIDER options (set in .env):
 *
 *   "textbelt"  → FREE. 1 free SMS/day per server IP. Good for testing.
 *                 No signup needed. Just works.
 *
 *   "fast2sms"  → FREE for Indian numbers (+91). Register at fast2sms.com
 *                 Set FAST2SMS_API_KEY in .env.
 *
 *   "twilio"    → Free trial credits then paid.
 *                 Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM.
 *
 *   (empty)     → SMS disabled.
 */

import twilio from "twilio";

export interface SmsMessage {
  to: string;
  type: "confirmation" | "reminder" | "cancellation" | "update" | "organizer_alert";
  eventTitle: string;
  attendeeName: string;
  ticketCode?: string;
  eventDate?: string;
  eventUrl?: string;
  attendeeCount?: number;
}

// ─── Body builder (kept short for SMS) ───────────────────────────────────────
function buildSmsBody(msg: SmsMessage): string {
  const APP = "EventSphere";
  switch (msg.type) {
    case "confirmation":
      return [
        `[${APP}] Registered!`,
        `Event: ${msg.eventTitle}`,
        msg.ticketCode ? `Ticket: ${msg.ticketCode}` : "",
        msg.eventDate  ? `Date: ${msg.eventDate}`    : "",
        msg.eventUrl   ? msg.eventUrl                : "",
      ].filter(Boolean).join("\n");

    case "reminder":
      return [
        `[${APP}] Reminder: ${msg.eventTitle}`,
        msg.eventDate  ? `Date: ${msg.eventDate}`    : "",
        msg.ticketCode ? `Ticket: ${msg.ticketCode}` : "",
        msg.eventUrl   ? msg.eventUrl                : "",
      ].filter(Boolean).join("\n");

    case "cancellation":
      return [
        `[${APP}] Registration cancelled: ${msg.eventTitle}`,
        msg.eventUrl ? `Re-register: ${msg.eventUrl}` : "",
      ].filter(Boolean).join("\n");

    case "update":
      return [
        `[${APP}] Event update: ${msg.eventTitle}`,
        msg.eventUrl ? msg.eventUrl : "",
      ].filter(Boolean).join("\n");

    case "organizer_alert":
      return [
        `[${APP}] New registration!`,
        `${msg.attendeeName} joined: ${msg.eventTitle}`,
        msg.attendeeCount !== undefined ? `Total: ${msg.attendeeCount}` : "",
        msg.eventUrl ? msg.eventUrl : "",
      ].filter(Boolean).join("\n");
  }
}

// ─── Twilio SMS ────────────────────────────────────────────────────────────────
async function sendViaTwilioSms(msg: SmsMessage): Promise<boolean> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_SMS_FROM;
  if (!sid || !token || !from) { console.warn("[SMS/Twilio] Missing env vars"); return false; }
  const to = msg.to.replace(/^whatsapp:/, "");
  try {
    await twilio(sid, token).messages.create({ from, to, body: buildSmsBody(msg) });
    console.log(`[SMS/Twilio] Sent to ${to}`);
    return true;
  } catch (err: any) { console.error("[SMS/Twilio]", err.message); return false; }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function sendSms(msg: SmsMessage): Promise<boolean> {
  if (process.env.NODE_ENV === "test") return true;
  if (!msg.to) return false;
  if (process.env.SMS_ENABLED !== "true") return false;

  return sendViaTwilioSms(msg);
}

