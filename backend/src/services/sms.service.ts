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

// ─── TextBelt (free — 1 SMS/day/IP, no signup) ────────────────────────────────
async function sendViaTextBelt(msg: SmsMessage): Promise<boolean> {
  const to = msg.to.replace(/^\+/, "").replace(/\D/g, "");
  try {
    const res = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: msg.to, message: buildSmsBody(msg), key: "textbelt" }),
    });
    const data: any = await res.json();
    if (data.success) { console.log(`[SMS/TextBelt] Sent to ${msg.to}`); return true; }
    console.warn(`[SMS/TextBelt] Failed (${msg.to}): ${data.error} — quota left: ${data.quotaRemaining}`);
    return false;
  } catch (err: any) { console.error("[SMS/TextBelt]", err.message); return false; }
}

// ─── Fast2SMS (free for Indian +91 numbers) ────────────────────────────────────
async function sendViaFast2Sms(msg: SmsMessage): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) { console.warn("[SMS/Fast2SMS] FAST2SMS_API_KEY not set"); return false; }

  // Fast2SMS expects numbers without country code (10 digits for India)
  const numbers = msg.to.replace(/^\+91/, "").replace(/\D/g, "");
  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "q",           // quick transactional route
        message: buildSmsBody(msg),
        language: "english",
        flash: 0,
        numbers,
      }),
    });
    const data: any = await res.json();
    if (data.return) { console.log(`[SMS/Fast2SMS] Sent to ${msg.to}`); return true; }
    console.warn("[SMS/Fast2SMS] Failed:", JSON.stringify(data));
    return false;
  } catch (err: any) { console.error("[SMS/Fast2SMS]", err.message); return false; }
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

  switch ((process.env.SMS_PROVIDER ?? "").toLowerCase()) {
    case "textbelt":  return sendViaTextBelt(msg);
    case "fast2sms":  return sendViaFast2Sms(msg);
    case "twilio":    return sendViaTwilioSms(msg);
    default:          return false;
  }
}
