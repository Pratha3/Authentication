/**
 * Event Reminder Job
 *
 * Runs every hour. For each upcoming event starting in ~24 h or ~1 h,
 * sends in-app reminders plus enabled mobile channels to all confirmed attendees.
 *
 * De-duplication: a per-process in-memory set tracks which (eventId, window)
 * combinations have already fired so restarts won't double-send within the
 * same run. The set resets on restart which is intentional — a restart
 * after > 1 h means new reminders are correct.
 */

import { Event } from "../models/Event";
import { Registration } from "../models/Registration";
import { sendEventReminders } from "../services/notification.service";

const HOUR_MS = 60 * 60 * 1_000;

// Tracks "eventId-Xh" keys to avoid duplicate sends in the same process lifetime
const firedReminders = new Set<string>();

interface ReminderWindow {
  label: string;
  hoursUntil: number;
  windowStartMs: number; // how far ahead to start looking
  windowEndMs: number;   // how far ahead to stop looking
}

const WINDOWS: ReminderWindow[] = [
  // 24-hour reminder: catch events starting between 23 h and 25 h from now
  { label: "24h", hoursUntil: 24, windowStartMs: 23 * HOUR_MS, windowEndMs: 25 * HOUR_MS },
  // 1-hour reminder: catch events starting between 55 min and 65 min from now
  { label: "1h",  hoursUntil: 1,  windowStartMs: 55 * 60_000,  windowEndMs: 65 * 60_000  },
];

async function checkAndSendReminders(): Promise<void> {
  const now = new Date();

  for (const window of WINDOWS) {
    const windowStart = new Date(now.getTime() + window.windowStartMs);
    const windowEnd   = new Date(now.getTime() + window.windowEndMs);

    let events: any[];
    try {
      events = await Event.find({
        status: "upcoming",
        startDate: { $gte: windowStart, $lte: windowEnd },
      }).lean();
    } catch (err: any) {
      console.error(`[Reminders] DB error fetching events for ${window.label} window:`, err.message);
      continue;
    }

    for (const event of events) {
      const dedupeKey = `${String(event._id)}-${window.label}`;
      if (firedReminders.has(dedupeKey)) continue;
      firedReminders.add(dedupeKey);

      let registrations: Array<{ userId: any; ticketCode: string }>;
      try {
        registrations = await Registration.find({
          eventId: event._id,
          status: "confirmed",
        })
          .select("userId ticketCode")
          .lean();
      } catch (err: any) {
        console.error(`[Reminders] DB error fetching registrations for event ${event._id}:`, err.message);
        continue;
      }

      if (registrations.length === 0) continue;

      console.log(
        `[Reminders] Sending ${window.label} reminder for "${event.title}" → ${registrations.length} attendee(s)`
      );

      try {
        await sendEventReminders(
          event,
          registrations.map((r) => ({
            userId: String(r.userId),
            ticketCode: r.ticketCode,
          })),
          window.hoursUntil
        );
      } catch (err: any) {
        console.error(`[Reminders] Failed to send reminders for event ${event._id}:`, err.message);
        // Remove from fired set so we retry on next tick
        firedReminders.delete(dedupeKey);
      }
    }
  }
}

export function startReminderJob(): void {
  // Run once immediately (catches events missed if server was down)
  checkAndSendReminders().catch(() => {});

  // Then every hour
  setInterval(() => checkAndSendReminders().catch(() => {}), HOUR_MS);

  console.log("[Reminders] Event reminder job started (1 h interval)");
}
