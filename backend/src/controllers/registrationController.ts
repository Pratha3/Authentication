import { Response } from "express";
import mongoose from "mongoose";
import { Registration } from "../models/Registration";
import { Event } from "../models/Event";
import { Organizer } from "../models/Organizer";
import { Profile } from "../models/Profile";
import { AuthRequest } from "../middleware/auth";
import { emitAttendeeUpdate, emitOrganizerDashboardUpdate } from "../sockets/io";
import { notifyRegistration, notifyCancellation } from "../services/notification.service";

// ─── POST /api/registrations ─────────────────────────────────────────────
export const registerForEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId, attendeeDetails = {} } = req.body;

    if (!eventId || !mongoose.isValidObjectId(eventId)) {
      res.status(400).json({ message: "Valid eventId is required." });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ message: "Event not found." }); return; }
    if (event.status === "cancelled") { res.status(400).json({ message: "Event is cancelled." }); return; }
    if (event.registrationDeadline && event.registrationDeadline < new Date()) {
      res.status(400).json({ message: "Registration deadline has passed." });
      return;
    }

    const existing = await Registration.findOne({ eventId, userId: req.userId });
    if (existing && existing.status !== "cancelled") {
      res.status(409).json({ message: "Already registered for this event." });
      return;
    }

    const isFull = Boolean(event.capacity && event.currentAttendees >= event.capacity);
    const status: "confirmed" | "waitlisted" = isFull ? "waitlisted" : "confirmed";

    let registration;
    if (existing) {
      existing.status = status;
      existing.cancelledAt = null;
      existing.attendeeDetails = attendeeDetails;
      await existing.save();
      registration = existing;
    } else {
      registration = await Registration.create({
        eventId,
        userId: req.userId,
        status,
        attendeeDetails,
      });
    }

    // Update attendee count + emit real-time update
    if (status === "confirmed") {
      const updated = await Event.findByIdAndUpdate(
        eventId,
        { $inc: { currentAttendees: 1 } },
        { new: true }
      );
      if (updated) {
        emitAttendeeUpdate(String(eventId), updated.currentAttendees, updated.capacity, updated.status);
      }
    }

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
        attendeeCount: event.currentAttendees + (status === "confirmed" ? 1 : 0),
        status,
        registrationId: String(registration._id),
      });
    }

    res.status(201).json({
      data: {
        id: String(registration._id),
        eventId: String(registration.eventId),
        userId: String(registration.userId),
        status: registration.status,
        ticketCode: registration.ticketCode,
        attendeeDetails: registration.attendeeDetails,
        registeredAt: registration.registeredAt,
        event: (registration.eventId as any),
      },
      message: status === "confirmed" ? "Registration confirmed!" : "Added to waitlist.",
      error: null,
    });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    if (err.code === 11000) {
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
    const registration = await Registration.findOne({ eventId, userId: req.userId });
    if (!registration) { res.status(404).json({ message: "Registration not found." }); return; }
    if (registration.status === "cancelled") { res.status(400).json({ message: "Already cancelled." }); return; }

    const wasConfirmed = registration.status === "confirmed";
    registration.status = "cancelled";
    registration.cancelledAt = new Date();
    await registration.save();

    if (wasConfirmed) {
      const updated = await Event.findByIdAndUpdate(
        eventId,
        { $inc: { currentAttendees: -1 } },
        { new: true }
      );
      if (updated) emitAttendeeUpdate(eventId, updated.currentAttendees, updated.capacity, updated.status);

      // Promote first waitlisted user if any
      const waitlisted = await Registration.findOne({ eventId, status: "waitlisted" })
        .sort({ registeredAt: 1 });
      if (waitlisted) {
        waitlisted.status = "confirmed";
        await waitlisted.save();
        const promotedEvent = await Event.findByIdAndUpdate(eventId, { $inc: { currentAttendees: 1 } }, { new: true });
        if (promotedEvent) emitAttendeeUpdate(eventId, promotedEvent.currentAttendees, promotedEvent.capacity, promotedEvent.status);

        // Notify promoted user
        const promotedProfile = await Profile.findOne({ userId: waitlisted.userId }).lean();
        if (promotedProfile?.email) {
          const { sendEmail, buildRegistrationEmail } = await import("../services/email.service");
          const ev = await Event.findById(eventId).lean();
          if (ev) {
            sendEmail({
              to: promotedProfile.email,
              subject: `✅ You're now confirmed for ${ev.title}!`,
              html: buildRegistrationEmail({
                attendeeName: promotedProfile.fullName ?? promotedProfile.email.split("@")[0],
                eventTitle: ev.title,
                eventDate: new Date(ev.startDate).toLocaleString("en-IN"),
                eventLocation: ev.city ?? "TBD",
                ticketCode: waitlisted.ticketCode,
                status: "confirmed",
                eventUrl: `${process.env.CLIENT_URL}/events/${ev.slug}`,
                organizerName: "Organizer",
                isOnline: ev.isOnline,
                onlineUrl: ev.onlineUrl,
              }),
            }).catch(() => {});
          }
        }
      }
    }

    // Fire-and-forget cancellation notifications
    const event = await Event.findById(eventId);
    if (event) notifyCancellation(registration, event).catch(() => {});

    res.json({ data: null, error: null, message: "Registration cancelled." });
  } catch (err) {
    console.error("CANCEL REGISTRATION ERROR:", err);
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
