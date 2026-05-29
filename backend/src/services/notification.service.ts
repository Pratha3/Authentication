/**
 * Notification Orchestrator
 *
 * Channels dispatched on each event:
 *   1. In-app  — MongoDB record + Socket.io real-time push (synchronous)
 *   2. SMS      — queued via notification-queue.service (retried on failure)
 *   3. WhatsApp — optional Meta integration, only when WHATSAPP_ENABLED=true
 *
 * The queue ensures messages survive server crashes and retries automatically
 * with exponential back-off. Registration responses are never blocked.
 */

import { Notification } from "../models/Notification";
import { Profile } from "../models/Profile";
import { emitUserNotification } from "../sockets/io";
import { enqueueNotification } from "./notification-queue.service";
import { isWhatsAppEnabled } from "./whatsapp.service";
import { normalizePhone } from "../utils/phone.utils";
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

function idString(value: unknown): string {
  if (value && typeof value === "object") {
    const maybeDoc = value as { _id?: unknown; id?: unknown };
    if (maybeDoc._id) return String(maybeDoc._id);
    if (maybeDoc.id) return String(maybeDoc.id);
  }
  return String(value);
}

async function getProfile(userId: string) {
  try { return await Profile.findOne({ userId }).lean(); }
  catch { return null; }
}

// ── In-app notification (always synchronous — never queued) ───────────────────

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

// ── Mobile notification helper (validates phone, enqueues both channels) ──────

async function enqueueMobile(params: {
  rawPhone: string;
  name: string;
  type: "confirmation" | "reminder" | "cancellation" | "update" | "organizer_alert";
  eventTitle: string;
  ticketCode?: string;
  eventDate?: string;
  eventUrl?: string;
  attendeeCount?: number;
  userId?: string;
  eventId?: string;
}): Promise<void> {
  const phone = normalizePhone(params.rawPhone);
  if (!phone) {
    console.warn(`[Notification] Invalid/unsupported phone "${params.rawPhone}" — skipping mobile`);
    return;
  }

  const basePayload = {
    to: phone,
    type: params.type,
    attendeeName: params.name,
    eventTitle: params.eventTitle,
    ticketCode: params.ticketCode,
    eventDate: params.eventDate,
    eventUrl: params.eventUrl,
    attendeeCount: params.attendeeCount,
  };

  const jobs: Array<Promise<void>> = [];

  if (isWhatsAppEnabled()) {
    jobs.push(enqueueNotification({
      channel: "whatsapp",
      payload: basePayload,
      userId: params.userId,
      eventId: params.eventId,
    }));
  }

  if (process.env.SMS_ENABLED === "true") {
    jobs.push(enqueueNotification({
      channel: "sms",
      payload: basePayload,
      userId: params.userId,
      eventId: params.eventId,
    }));
  }

  if (jobs.length > 0) {
    await Promise.allSettled(jobs);
  }
}

// ── Public notification functions ─────────────────────────────────────────────

export async function notifyRegistration(
  registration: IRegistration,
  event: IEvent,
  organizer: IOrganizer
): Promise<void> {
  const userId   = idString(registration.userId);
  const eventId  = idString(event._id);
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;
  const dashUrl  = `${CLIENT_URL}/organizer/dashboard`;

  const details      = (registration as any).attendeeDetails ?? {};
  const profile      = await getProfile(userId);
  const attendeeName = details.answers?.registrationName || profile?.fullName || "Attendee";
  const rawPhone     = details.phone || profile?.phone || "";
  const isConfirmed  = registration.status === "confirmed";

  // 1. In-app notification to attendee
  await pushInApp(
    userId,
    isConfirmed
      ? `You are registered for ${event.title}!`
      : `You are on the waitlist for ${event.title}`,
    isConfirmed
      ? `Ticket: ${registration.ticketCode}. See you there!`
      : "We will notify you if a spot opens up.",
    "registration",
    { eventId, eventSlug: event.slug, ticketCode: registration.ticketCode, status: registration.status }
  );

  // 2. Mobile notification to confirmed attendee (queued with retry)
  if (rawPhone && isConfirmed) {
    enqueueMobile({
      rawPhone,
      name: attendeeName,
      type: "confirmation",
      eventTitle: event.title,
      ticketCode: registration.ticketCode,
      eventDate: fmtDate(event.startDate),
      eventUrl,
      userId,
      eventId,
    }).catch(() => {});
  }

  // 3. In-app notification to organizer
  const orgUserId  = idString(organizer.userId);
  const orgProfile = await getProfile(orgUserId);
  const orgPhone   = orgProfile?.phone ?? "";

  await pushInApp(
    orgUserId,
    `New registration: ${event.title}`,
    `${attendeeName} just registered (${registration.status}).`,
    "organizer",
    { eventId, eventSlug: event.slug, attendeeUserId: userId }
  );

  // 4. Mobile notification to organizer (queued with retry)
  if (orgPhone) {
    enqueueMobile({
      rawPhone: orgPhone,
      name: orgProfile?.fullName ?? "Organizer",
      type: "organizer_alert",
      eventTitle: event.title,
      attendeeCount: event.currentAttendees,
      eventUrl: dashUrl,
      userId: orgUserId,
      eventId,
    }).catch(() => {});
  }
}

export async function notifyCancellation(
  registration: IRegistration,
  event: IEvent
): Promise<void> {
  const userId   = idString(registration.userId);
  const eventId  = idString(event._id);
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;
  const details  = (registration as any).attendeeDetails ?? {};
  const profile  = await getProfile(userId);
  const name     = details.answers?.registrationName || profile?.fullName || "Attendee";
  const rawPhone = details.phone || profile?.phone || "";

  await pushInApp(
    userId,
    `Registration cancelled: ${event.title}`,
    "Your registration has been cancelled. Re-register anytime.",
    "registration",
    { eventId, eventSlug: event.slug }
  );

  if (rawPhone) {
    enqueueMobile({
      rawPhone,
      name,
      type: "cancellation",
      eventTitle: event.title,
      eventUrl,
      userId,
      eventId,
    }).catch(() => {});
  }
}

export async function notifyEventStatusUpdate(
  event: IEvent,
  registeredUserIds: string[]
): Promise<void> {
  const eventId  = idString(event._id);
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;

  const msgs: Record<string, { title: string; body: string }> = {
    live:      { title: `${event.title} is LIVE!`,   body: "The event has started — join now!" },
    cancelled: { title: `${event.title} cancelled`,   body: "The event has been cancelled." },
    completed: { title: `${event.title} wrapped up`,  body: "Thanks for attending!" },
  };
  const msg = msgs[event.status];
  if (!msg) return;

  await Promise.allSettled(
    registeredUserIds.map(async (uid) => {
      await pushInApp(
        uid,
        msg.title,
        msg.body,
        "event_update",
        { eventId, eventSlug: event.slug, status: event.status }
      );

      const profile  = await getProfile(uid);
      const rawPhone = profile?.phone ?? "";
      if (rawPhone) {
        enqueueMobile({
          rawPhone,
          name: profile?.fullName ?? "Attendee",
          type: "update",
          eventTitle: event.title,
          eventUrl,
          userId: uid,
          eventId,
        }).catch(() => {});
      }
    })
  );
}

export async function sendEventReminders(
  event: IEvent,
  registrations: Array<{ userId: string; ticketCode: string }>,
  hoursUntil: number
): Promise<void> {
  const eventId  = idString(event._id);
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;

  await Promise.allSettled(
    registrations.map(async ({ userId, ticketCode }) => {
      const profile  = await getProfile(userId);
      const rawPhone = profile?.phone ?? "";

      await pushInApp(
        userId,
        `Reminder: ${event.title} ${hoursUntil <= 24 ? "is tomorrow!" : `in ${Math.round(hoursUntil / 24)} days`}`,
        `Ticket: ${ticketCode}`,
        "reminder",
        { eventId, eventSlug: event.slug }
      );

      if (rawPhone) {
        enqueueMobile({
          rawPhone,
          name: profile?.fullName ?? "Attendee",
          type: "reminder",
          eventTitle: event.title,
          ticketCode,
          eventDate: fmtDate(event.startDate),
          eventUrl,
          userId,
          eventId,
        }).catch(() => {});
      }
    })
  );
}
