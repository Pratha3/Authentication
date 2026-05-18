import twilio from "twilio";
import { sendWhatsAppMessage } from "./whatsapp-client.service";

export interface WhatsAppMessage {
  to: string;
  type: "confirmation" | "reminder" | "cancellation" | "update";
  eventTitle: string;
  attendeeName: string;
  ticketCode?: string;
  eventDate?: string;
  eventUrl?: string;
}

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
  }
  return lines.join("\n");
}

async function sendViaBaileys(msg: WhatsAppMessage): Promise<boolean> {
  return sendWhatsAppMessage(msg.to, buildBody(msg));
}

async function sendViaTwilio(msg: WhatsAppMessage): Promise<boolean> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) { console.warn("[WhatsApp/Twilio] Missing env vars"); return false; }
  const to = msg.to.startsWith("whatsapp:") ? msg.to : `whatsapp:${msg.to}`;
  try {
    await twilio(sid, token).messages.create({ from, to, body: buildBody(msg) });
    console.log(`[WhatsApp/Twilio] Sent to ${msg.to}`);
    return true;
  } catch (err: any) { console.error("[WhatsApp/Twilio]", err.message); return false; }
}

async function sendViaMeta(msg: WhatsAppMessage): Promise<boolean> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const numId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !numId) { console.warn("[WhatsApp/Meta] Missing env vars"); return false; }
  const to = msg.to.replace(/^whatsapp:/, "");
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${numId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: buildBody(msg) } }),
    });
    if (!res.ok) { console.error("[WhatsApp/Meta]", await res.text()); return false; }
    return true;
  } catch (err: any) { console.error("[WhatsApp/Meta]", err.message); return false; }
}

export async function sendWhatsApp(msg: WhatsAppMessage): Promise<boolean> {
  if (process.env.NODE_ENV === "test") return true;
  if (!msg.to) return false;
  switch ((process.env.WHATSAPP_PROVIDER ?? "").toLowerCase()) {
    case "baileys": return sendViaBaileys(msg);
    case "twilio":  return sendViaTwilio(msg);
    case "meta":    return sendViaMeta(msg);
    default:        return false;
  }
}
