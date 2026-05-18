/**
 * Notification Orchestrator
 *
 * Channels (fire-and-forget — never block the registration request):
 *   1. In-app  — MongoDB record + Socket.io real-time push
 *   2. WhatsApp — Twilio or Meta (WHATSAPP_PROVIDER env)
 *   3. SMS      — Twilio (SMS_ENABLED=true env)
 */

import { Notification } from "../models/Notification";
import { Profile } from "../models/Profile";
import { emitUserNotification } from "../sockets/io";
import { sendWhatsApp } from "./whatsapp.service";
import { sendSms } from "./sms.service";
import type { IEvent } from "../models/Event";
import type { IRegistration } from "../models/Registration";
import type { IOrganizer } from "../models/Organizer";

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

async function getProfile(userId: string) {
  try { return await Profile.findOne({ userId }).lean(); }
  catch { return null; }
}

async function pushInApp(
  userId: string,
  title: string,
  body: string,
  type: "registration" | "organizer" | "system" | "event_update" | "reminder",
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const notif = await Notification.create({ userId, title, body, type, data: data ?? null });
    emitUserNotification(userId, {
      id: String(notif._id),
      title: notif.title,
      body: notif.body,
      type: notif.type,
      data: notif.data,
      is_read: false,
      created_at: notif.createdAt,
    });
  } catch (err: any) {
    console.error("[Notification] in-app error:", err.message);
  }
}

async function sendMobile(params: {
  phone: string;
  name: string;
  type: "confirmation" | "reminder" | "cancellation" | "update";
  eventTitle: string;
  ticketCode?: string;
  eventDate?: string;
  eventUrl?: string;
}): Promise<void> {
  if (!params.phone) return;
  const payload = {
    to: params.phone,
    type: params.type,
    attendeeName: params.name,
    eventTitle: params.eventTitle,
    ticketCode: params.ticketCode,
    eventDate: params.eventDate,
    eventUrl: params.eventUrl,
  };
  await Promise.allSettled([sendWhatsApp(payload), sendSms(payload)]);
}

export async function notifyRegistration(
  registration: IRegistration,
  event: IEvent,
  organizer: IOrganizer
): Promise<void> {
  const userId = String(registration.userId);
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;
  const dashUrl = `${CLIENT_URL}/organizer/dashboard`;

  const details = (registration as any).attendeeDetails ?? {};
  const profile = await getProfile(userId);
  const attendeeName = details.answers?.registrationName || profile?.fullName || "Attendee";
  const attendeePhone = details.phone || profile?.phone || "";

  const isConfirmed = registration.status === "confirmed";

  await pushInApp(
    userId,
    isConfirmed ? `You are registered for ${event.title}!` : `You are on the waitlist for ${event.title}`,
    isConfirmed ? `Ticket: ${registration.ticketCode}. See you there!` : "We will notify you if a spot opens up.",
    "registration",
    { eventId: String(event._id), eventSlug: event.slug, ticketCode: registration.ticketCode, status: registration.status }
  );

  if (attendeePhone) {
    sendMobile({
      phone: attendeePhone,
      name: attendeeName,
      type: "confirmation",
      eventTitle: event.title,
      ticketCode: registration.ticketCode,
      eventDate: fmtDate(event.startDate),
      eventUrl,
    }).catch(() => {});
  }

  const orgUserId = String(organizer.userId);
  const orgProfile = await getProfile(orgUserId);
  const orgPhone = orgProfile?.phone ?? "";

  await pushInApp(
    orgUserId,
    `New registration: ${event.title}`,
    `${attendeeName} just registered (${registration.status}).`,
    "organizer",
    { eventId: String(event._id), eventSlug: event.slug, attendeeUserId: userId }
  );

  if (orgPhone) {
    Promise.allSettled([
      sendWhatsApp({ to: orgPhone, type: "update", attendeeName, eventTitle: event.title, eventUrl: dashUrl }),
      sendSms({ to: orgPhone, type: "organizer_alert", attendeeName, eventTitle: event.title, attendeeCount: event.currentAttendees, eventUrl: dashUrl }),
    ]).catch(() => {});
  }
}

export async function notifyCancellation(
  registration: IRegistration,
  event: IEvent
): Promise<void> {
  const userId = String(registration.userId);
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;
  const details = (registration as any).attendeeDetails ?? {};
  const profile = await getProfile(userId);
  const name = details.answers?.registrationName || profile?.fullName || "Attendee";
  const phone = details.phone || profile?.phone || "";

  await pushInApp(
    userId,
    `Registration cancelled: ${event.title}`,
    "Your registration has been cancelled. Re-register anytime.",
    "registration",
    { eventId: String(event._id), eventSlug: event.slug }
  );

  if (phone) {
    sendMobile({ phone, name, type: "cancellation", eventTitle: event.title, eventUrl }).catch(() => {});
  }
}

export async function notifyEventStatusUpdate(
  event: IEvent,
  registeredUserIds: string[]
): Promise<void> {
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;
  const msgs: Record<string, { title: string; body: string }> = {
    live:      { title: `${event.title} is LIVE!`,  body: "The event has started — join now!" },
    cancelled: { title: `${event.title} cancelled`,  body: "The event has been cancelled." },
    completed: { title: `${event.title} wrapped up`, body: "Thanks for attending!" },
  };
  const msg = msgs[event.status];
  if (!msg) return;

  await Promise.allSettled(
    registeredUserIds.map(async (uid) => {
      await pushInApp(uid, msg.title, msg.body, "event_update", { eventId: String(event._id), eventSlug: event.slug, status: event.status });
      const profile = await getProfile(uid);
      const phone = profile?.phone ?? "";
      if (phone) {
        sendMobile({ phone, name: profile?.fullName ?? "Attendee", type: "update", eventTitle: event.title, eventUrl }).catch(() => {});
      }
    })
  );
}

export async function sendEventReminders(
  event: IEvent,
  registrations: Array<{ userId: string; ticketCode: string }>,
  hoursUntil: number
): Promise<void> {
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;
  await Promise.allSettled(
    registrations.map(async ({ userId, ticketCode }) => {
      const profile = await getProfile(userId);
      const phone = profile?.phone ?? "";
      await pushInApp(
        userId,
        `Reminder: ${event.title} ${hoursUntil <= 24 ? "is tomorrow!" : `in ${Math.round(hoursUntil / 24)} days`}`,
        `Ticket: ${ticketCode}`,
        "reminder",
        { eventId: String(event._id), eventSlug: event.slug }
      );
      if (phone) {
        sendMobile({ phone, name: profile?.fullName ?? "Attendee", type: "reminder", eventTitle: event.title, ticketCode, eventDate: fmtDate(event.startDate), eventUrl }).catch(() => {});
      }
    })
  );
}
