import { Response } from "express";
import mongoose from "mongoose";
import { Registration } from "../models/Registration";
import { Event } from "../models/Event";
import { Organizer } from "../models/Organizer";
import { Profile } from "../models/Profile";
import { AuthRequest } from "../middleware/auth";
import { emitAttendeeUpdate, emitOrganizerDashboardUpdate } from "../sockets/io";
import { notifyRegistration, notifyCancellation } from "../services/notification.service";
import { enqueueNotification } from "../services/notification-queue.service";
import { normalizePhone } from "../utils/phone.utils";
import { env } from "../config/env";
import type { IEvent } from "../models/Event";
import type { IRegistration } from "../models/Registration";

type OptionalSession = mongoose.ClientSession | null;
type EventDocument = mongoose.HydratedDocument<IEvent>;
type RegistrationDocument = mongoose.HydratedDocument<IRegistration>;
type ControllerError = Error & { statusCode?: number; code?: number | string };

function httpError(statusCode: number, message: string): ControllerError {
  const error = new Error(message) as ControllerError;
  error.statusCode = statusCode;
  return error;
}

function idString(value: unknown): string {
  if (value && typeof value === "object") {
    const maybeDoc = value as { _id?: unknown; id?: unknown };
    if (maybeDoc._id) return String(maybeDoc._id);
    if (maybeDoc.id) return String(maybeDoc.id);
  }
  return String(value);
}

function isStandaloneTransactionError(err: unknown): boolean {
  const error = err as { code?: number; codeName?: string; message?: string };
  return (
    error.code === 20 ||
    error.codeName === "IllegalOperation" ||
    Boolean(error.message?.includes("Transaction numbers are only allowed"))
  );
}

async function runWithTransactionFallback<T>(
  operation: (session: OptionalSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    try {
      let result: T | undefined;
      await session.withTransaction(async () => {
        result = await operation(session);
      });
      return result as T;
    } catch (err) {
      if (isStandaloneTransactionError(err) && env.NODE_ENV !== "production") {
        console.warn("[DB] Transactions are unavailable; retrying write without a session.");
        return operation(null);
      }
      throw err;
    }
  } finally {
    await session.endSession();
  }
}

// ─── POST /api/registrations ─────────────────────────────────────────────
export const registerForEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId, attendeeDetails = {} } = req.body;

    if (!eventId || !mongoose.isValidObjectId(eventId)) {
      res.status(400).json({ message: "Valid eventId is required." });
      return;
    }

    const state: {
      event?: EventDocument;
      registration?: RegistrationDocument;
    } = {};
    let status = "waitlisted" as "confirmed" | "waitlisted";
    let attendeeCount = 0;
    let eventCapacity: number | null = null;
    let eventStatus = "";

    await runWithTransactionFallback(async (session) => {
      state.event = await Event.findById(eventId).session(session) ?? undefined;
      const event = state.event;
      if (!event) throw httpError(404, "Event not found.");
      if (event.status === "cancelled") throw httpError(400, "Event is cancelled.");
      if (event.registrationDeadline && event.registrationDeadline < new Date()) {
        throw httpError(400, "Registration deadline has passed.");
      }

      const existing = await Registration.findOne({ eventId, userId: req.userId }).session(session);
      if (existing && existing.status !== "cancelled") {
        throw httpError(409, "Already registered for this event.");
      }

      const confirmedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          $or: [
            { capacity: null },
            { capacity: { $exists: false } },
            { $expr: { $lt: ["$currentAttendees", "$capacity"] } },
          ],
        },
        { $inc: { currentAttendees: 1 } },
        { new: true, ...(session ? { session } : {}) }
      );

      status = confirmedEvent ? "confirmed" : "waitlisted";
      const latestEvent = confirmedEvent ?? event;
      attendeeCount = latestEvent.currentAttendees;
      eventCapacity = latestEvent.capacity;
      eventStatus = latestEvent.status;

      if (existing) {
        existing.status = status;
        existing.cancelledAt = null;
        existing.attendeeDetails = attendeeDetails;
        await existing.save({ session });
        state.registration = existing;
      } else {
        const [created] = await Registration.create(
          [{
            eventId,
            userId: req.userId,
            status,
            attendeeDetails,
          }],
          session ? { session } : undefined
        );
        state.registration = created;
      }
    });

    const event = state.event;
    const registration = state.registration;
    if (!event || !registration) throw httpError(500, "Registration could not be completed.");

    emitAttendeeUpdate(String(eventId), attendeeCount, eventCapacity, eventStatus);

    // Populate for response
    await registration.populate([
      { path: "eventId", select: "title slug bannerUrl startDate endDate city status category organizerId" },
      { path: "userId", select: "name email" },
    ]);

    // Fire-and-forget: email + in-app notifications
    const organizer = await Organizer.findById(event.organizerId);
    if (organizer) {
      notifyRegistration(registration, event, organizer).catch(() => {});
    }

    // Real-time push to organizer dashboard room
    const orgUserId = String(organizer?.userId ?? "");
    if (orgUserId) {
      const attendeeProfile = await Profile.findOne({ userId: req.userId }).lean();
      emitOrganizerDashboardUpdate(orgUserId, {
        type: "new_registration",
        eventId: String(eventId),
        attendeeName: attendeeProfile?.fullName ?? attendeeProfile?.email ?? "Someone",
        attendeeCount,
        status,
        registrationId: String(registration._id),
      });
    }

    res.status(201).json({
      data: {
        id: String(registration._id),
        eventId: idString(registration.eventId),
        userId: idString(registration.userId),
        status: registration.status,
        ticketCode: registration.ticketCode,
        attendeeDetails: registration.attendeeDetails,
        registeredAt: registration.registeredAt,
        event: registration.eventId,
      },
      message: status === "confirmed" ? "Registration confirmed!" : "Added to waitlist.",
      error: null,
    });
  } catch (err: unknown) {
    const error = err as ControllerError;
    console.error("REGISTER ERROR:", err);
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error.code === 11000) {
      res.status(409).json({ message: "Already registered for this event." });
      return;
    }
    res.status(500).json({ message: "Failed to register. Please try again." });
  }
};

// ─── PATCH /api/registrations/:eventId/cancel ─────────────────────────────
export const cancelRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = String(req.params.eventId);
    if (!mongoose.isValidObjectId(eventId)) {
      res.status(400).json({ message: "Invalid event ID." });
      return;
    }

    const state: {
      registration?: RegistrationDocument;
      waitlisted?: RegistrationDocument;
      updatedEvent?: EventDocument;
    } = {};
    let wasConfirmed = false;

    await runWithTransactionFallback(async (session) => {
      state.registration = await Registration.findOne({ eventId, userId: req.userId }).session(session) ?? undefined;
      const registration = state.registration;
      if (!registration) throw httpError(404, "Registration not found.");
      if (registration.status === "cancelled") throw httpError(400, "Already cancelled.");

      wasConfirmed = registration.status === "confirmed";
      registration.status = "cancelled";
      registration.cancelledAt = new Date();
      await registration.save({ session });

      if (wasConfirmed) {
        state.updatedEvent = await Event.findByIdAndUpdate(
          eventId,
          { $inc: { currentAttendees: -1 } },
          { new: true, ...(session ? { session } : {}) }
        ) ?? undefined;

        state.waitlisted = await Registration.findOneAndUpdate(
          { eventId, status: "waitlisted" },
          { $set: { status: "confirmed" } },
          { sort: { registeredAt: 1 }, new: true, ...(session ? { session } : {}) }
        ) ?? undefined;

        if (state.waitlisted) {
          state.updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { $inc: { currentAttendees: 1 } },
            { new: true, ...(session ? { session } : {}) }
          ) ?? undefined;
        }
      }
    });

    const registration = state.registration;
    const waitlisted = state.waitlisted;
    const updatedEvent = state.updatedEvent;
    if (!registration) throw httpError(500, "Cancellation could not be completed.");

    if (wasConfirmed && updatedEvent) {
      emitAttendeeUpdate(eventId, updatedEvent.currentAttendees, updatedEvent.capacity, updatedEvent.status);
    }

    if (waitlisted) {
      // Notify promoted user via all channels
      const promotedProfile = await Profile.findOne({ userId: waitlisted.userId }).lean();
      const ev = await Event.findById(eventId).lean();

      if (ev && promotedProfile?.email) {
        const { sendEmail, buildRegistrationEmail } = await import("../services/email.service");
        const attendeeName = promotedProfile.fullName ?? promotedProfile.email.split("@")[0];
        sendEmail({
            to: promotedProfile.email,
            subject: `You're now confirmed for ${ev.title}!`,
            html: buildRegistrationEmail({
              attendeeName,
              eventTitle: ev.title,
              eventDate: new Date(ev.startDate).toLocaleString("en-IN"),
              eventLocation: ev.city ?? "TBD",
              ticketCode: waitlisted.ticketCode,
              status: "confirmed",
              eventUrl: `${env.CLIENT_URL}/events/${ev.slug}`,
              organizerName: "Organizer",
              isOnline: ev.isOnline,
              onlineUrl: ev.onlineUrl,
            }),
        }).catch(() => {});

        // WhatsApp + SMS for promoted user (queued with retry)
        const rawPhone = promotedProfile.phone ?? "";
        const phone = normalizePhone(rawPhone);
        if (phone) {
          const mobilePayload = {
            to: phone,
            type: "confirmation" as const,
            attendeeName,
            eventTitle: ev.title,
            ticketCode: waitlisted.ticketCode,
            eventDate: new Date(ev.startDate).toLocaleString("en-IN"),
            eventUrl: `${env.CLIENT_URL}/events/${ev.slug}`,
          };
          Promise.allSettled([
            enqueueNotification({ channel: "whatsapp", payload: mobilePayload, userId: String(waitlisted.userId), eventId }),
            enqueueNotification({ channel: "sms",      payload: mobilePayload, userId: String(waitlisted.userId), eventId }),
          ]).catch(() => {});
        }
      }
    }

    // Fire-and-forget cancellation notifications
    const event = await Event.findById(eventId);
    if (event) notifyCancellation(registration, event).catch(() => {});

    res.json({ data: null, error: null, message: "Registration cancelled." });
  } catch (err: unknown) {
    const error = err as ControllerError;
    console.error("CANCEL REGISTRATION ERROR:", err);
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Failed to cancel registration." });
  }
};

// ─── GET /api/registrations/my ────────────────────────────────────────────
export const getUserRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.find({
      userId: req.userId,
      status: { $in: ["confirmed", "waitlisted"] },
    })
      .populate("eventId", "title slug bannerUrl startDate endDate city status category isFree price")
      .sort({ registeredAt: -1 })
      .lean();

    const mapped = registrations.map((r) => ({
      id: String(r._id),
      eventId: String(r.eventId),
      status: r.status,
      ticketCode: r.ticketCode,
      attendeeDetails: r.attendeeDetails,
      registeredAt: r.registeredAt,
      checkedIn: r.checkedIn,
      event: r.eventId,
    }));

    res.json({ data: mapped, error: null });
  } catch (err) {
    console.error("GET MY REGISTRATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch registrations." });
  }
};

// ─── GET /api/registrations/event/:eventId ────────────────────────────────
export const getEventRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = String(req.params.eventId);
    if (!mongoose.isValidObjectId(eventId)) {
      res.status(400).json({ message: "Invalid event ID." });
      return;
    }

    // Verify organizer owns this event
    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ message: "Event not found." }); return; }

    const organizer = await Organizer.findOne({ userId: req.userId });
    if (!organizer || String(event.organizerId) !== String(organizer._id)) {
      res.status(403).json({ message: "Not authorized." });
      return;
    }

    const registrations = await Registration.find({
      eventId,
      status: { $ne: "cancelled" },
    })
      .populate("userId", "name email")
      .sort({ registeredAt: -1 })
      .lean();

    const mapped = registrations.map((r) => ({
      id: String(r._id),
      status: r.status,
      ticketCode: r.ticketCode,
      attendeeDetails: r.attendeeDetails,
      registeredAt: r.registeredAt,
      checkedIn: r.checkedIn,
      user: r.userId,
    }));

    res.json({ data: mapped, count: mapped.length, error: null });
  } catch (err) {
    console.error("GET EVENT REGISTRATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch registrations." });
  }
};

// ─── PATCH /api/registrations/:registrationId/checkin ─────────────────────
export const checkInAttendee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    if (!mongoose.isValidObjectId(String(registrationId))) {
      res.status(400).json({ message: "Invalid registration ID." });
      return;
    }

    const registration = await Registration.findById(String(registrationId));
    if (!registration) { res.status(404).json({ message: "Registration not found." }); return; }
    if (registration.status !== "confirmed") { res.status(400).json({ message: "Cannot check in non-confirmed registration." }); return; }

    // Verify organizer owns this event
    const event = await Event.findById(registration.eventId);
    const organizer = await Organizer.findOne({ userId: req.userId });
    if (!event || !organizer || String(event.organizerId) !== String(organizer._id)) {
      res.status(403).json({ message: "Not authorized." });
      return;
    }

    registration.checkedIn = !registration.checkedIn;
    registration.checkInTime = registration.checkedIn ? new Date() : null;
    await registration.save();

    res.json({ data: { checkedIn: registration.checkedIn }, error: null });
  } catch (err) {
    console.error("CHECK IN ERROR:", err);
    res.status(500).json({ message: "Check-in failed." });
  }
};
