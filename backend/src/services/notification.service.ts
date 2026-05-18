/**
 * Central Notification Orchestrator
 *
 * Handles all notification channels in one place:
 *  1. In-app (MongoDB + Socket.io push)
 *  2. Email (Nodemailer)
 *  3. WhatsApp (Twilio/Meta — optional)
 *
 * All methods are fire-and-forget safe — they swallow errors so that
 * a notification failure never breaks the main registration flow.
 */

import { Notification } from "../models/Notification";
import { Profile } from "../models/Profile";
import { emitUserNotification } from "../sockets/io";
import {
  sendEmail,
  buildRegistrationEmail,
  buildOrganizerNotificationEmail,
  buildCancellationEmail,
  buildReminderEmail,
  type RegistrationEmailData,
} from "./email.service";
import { sendWhatsApp } from "./whatsapp.service";
import type { IEvent } from "../models/Event";
import type { IRegistration } from "../models/Registration";
import type { IOrganizer } from "../models/Organizer";

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

// ─── Helper: format date for display ─────────────────────────────────────
function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Helper: safe profile fetch ────────────────────────────────────────────
async function getProfile(userId: string) {
  try {
    return await Profile.findOne({ userId }).lean();
  } catch {
    return null;
  }
}

// ─── In-app notification + real-time push ─────────────────────────────────
async function createInAppNotification(
  userId: string,
  title: string,
  body: string,
  type: "registration" | "organizer" | "system" | "event_update" | "reminder",
  data?: Record<string, unknown>
) {
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
    console.error("In-app notification error:", err.message);
  }
}

// ─── REGISTRATION CONFIRMED ───────────────────────────────────────────────
export async function notifyRegistration(
  registration: IRegistration,
  event: IEvent,
  organizer: IOrganizer
): Promise<void> {
  const userId = String(registration.userId);
  const eventId = String(event._id);
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;

  // 1. In-app notification → attendee
  const title = registration.status === "confirmed"
    ? `You're registered for ${event.title}!`
    : `You're on the waitlist for ${event.title}`;
  const body = registration.status === "confirmed"
    ? `Ticket: ${registration.ticketCode}. See you there!`
    : `We'll notify you if a spot opens up.`;

  await createInAppNotification(userId, title, body, "registration", {
    eventId,
    eventSlug: event.slug,
    ticketCode: registration.ticketCode,
    status: registration.status,
  });

  // 2. Email + WhatsApp → attendee (fire-and-forget)
  const profile = await getProfile(userId);
  if (profile?.email) {
    const emailData: RegistrationEmailData = {
      attendeeName: profile.fullName ?? profile.email.split("@")[0],
      eventTitle: event.title,
      eventDate: fmtDate(event.startDate),
      eventLocation: event.isOnline ? "Online" : (event.city ?? event.address ?? "TBD"),
      ticketCode: registration.ticketCode,
      status: registration.status as "confirmed" | "waitlisted",
      eventUrl,
      organizerName: organizer.organizationName,
      isOnline: event.isOnline,
      onlineUrl: event.onlineUrl,
    };

    sendEmail({
      to: profile.email,
      subject: `${registration.status === "confirmed" ? "✅ Confirmed" : "⏳ Waitlisted"}: ${event.title}`,
      html: buildRegistrationEmail(emailData),
    }).catch(() => {});

    if (profile.phone) {
      sendWhatsApp({
        to: profile.phone,
        type: "confirmation",
        eventTitle: event.title,
        attendeeName: profile.fullName ?? "",
        ticketCode: registration.ticketCode,
        eventDate: fmtDate(event.startDate),
        eventUrl,
      }).catch(() => {});
    }
  }

  // 3. In-app + email → organizer
  const organizerUserId = String(organizer.userId);
  const organizerProfile = await getProfile(organizerUserId);
  const attendeeName = profile?.fullName ?? profile?.email?.split("@")[0] ?? "Someone";
  const attendeeEmail = profile?.email ?? "";

  await createInAppNotification(
    organizerUserId,
    `New registration: ${event.title}`,
    `${attendeeName} just registered (${registration.status}).`,
    "organizer",
    { eventId, eventSlug: event.slug, attendeeUserId: userId }
  );

  if (organizerProfile?.email) {
    sendEmail({
      to: organizerProfile.email,
      subject: `🔔 New registration for ${event.title}`,
      html: buildOrganizerNotificationEmail({
        organizerName: organizerProfile.fullName ?? organizerProfile.email.split("@")[0],
        attendeeName,
        attendeeEmail,
        eventTitle: event.title,
        totalAttendees: event.currentAttendees,
        capacity: event.capacity,
        dashboardUrl: `${CLIENT_URL}/organizer/dashboard`,
        registrationStatus: registration.status as "confirmed" | "waitlisted",
      }),
    }).catch(() => {});
  }
}

// ─── REGISTRATION CANCELLED ───────────────────────────────────────────────
export async function notifyCancellation(
  registration: IRegistration,
  event: IEvent
): Promise<void> {
  const userId = String(registration.userId);
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;

  await createInAppNotification(
    userId,
    `Registration cancelled: ${event.title}`,
    "Your registration has been cancelled. Re-register anytime.",
    "registration",
    { eventId: String(event._id), eventSlug: event.slug }
  );

  const profile = await getProfile(userId);
  if (profile?.email) {
    sendEmail({
      to: profile.email,
      subject: `Registration cancelled: ${event.title}`,
      html: buildCancellationEmail({
        attendeeName: profile.fullName ?? profile.email.split("@")[0],
        eventTitle: event.title,
        eventDate: fmtDate(event.startDate),
        eventUrl,
      }),
    }).catch(() => {});
  }
}

// ─── EVENT STATUS UPDATE ──────────────────────────────────────────────────
export async function notifyEventStatusUpdate(
  event: IEvent,
  registeredUserIds: string[]
): Promise<void> {
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;
  const statusMessages: Record<string, { title: string; body: string }> = {
    live: { title: `🔴 ${event.title} is LIVE!`, body: "The event has started — join now!" },
    cancelled: { title: `❌ ${event.title} cancelled`, body: "Unfortunately the event has been cancelled." },
    completed: { title: `✅ ${event.title} wrapped up`, body: "Thanks for attending!" },
    postponed: { title: `📅 ${event.title} postponed`, body: "The event date has changed." },
  };

  const msg = statusMessages[event.status];
  if (!msg) return;

  await Promise.allSettled(
    registeredUserIds.map((uid) =>
      createInAppNotification(uid, msg.title, msg.body, "event_update", {
        eventId: String(event._id),
        eventSlug: event.slug,
        status: event.status,
        eventUrl,
      })
    )
  );
}

// ─── EVENT REMINDER (called by a scheduler / cron) ────────────────────────
export async function sendEventReminders(
  event: IEvent,
  registrations: Array<{ userId: string; ticketCode: string }>,
  hoursUntil: number
): Promise<void> {
  const eventUrl = `${CLIENT_URL}/events/${event.slug}`;
  const eventDate = fmtDate(event.startDate);
  const location = event.isOnline ? "Online" : (event.city ?? "TBD");

  await Promise.allSettled(
    registrations.map(async ({ userId, ticketCode }) => {
      const profile = await getProfile(userId);
      if (!profile?.email) return;

      const name = profile.fullName ?? profile.email.split("@")[0];

      await createInAppNotification(
        userId,
        `⏰ Reminder: ${event.title} ${hoursUntil <= 24 ? "tomorrow!" : `in ${Math.round(hoursUntil / 24)} days`}`,
        `Don't forget your ticket: ${ticketCode}`,
        "reminder",
        { eventId: String(event._id), eventSlug: event.slug }
      );

      sendEmail({
        to: profile.email,
        subject: `⏰ Reminder: ${event.title}`,
        html: buildReminderEmail({ attendeeName: name, eventTitle: event.title, eventDate, eventLocation: location, ticketCode, eventUrl, hoursUntil }),
      }).catch(() => {});

      if (profile.phone) {
        sendWhatsApp({ to: profile.phone, type: "reminder", eventTitle: event.title, attendeeName: name, ticketCode, eventDate, eventUrl }).catch(() => {});
      }
    })
  );
}
