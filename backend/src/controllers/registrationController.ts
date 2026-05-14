import { Response } from "express";
import { Registration } from "../models/Registration";
import { Event } from "../models/Event";
import { AuthRequest } from "../middleware/auth";

// POST /api/registrations
export const registerForEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.body;
    if (!eventId) { res.status(400).json({ message: "eventId is required." }); return; }

    const event = await Event.findById(eventId);
    if (!event) { res.status(404).json({ message: "Event not found." }); return; }
    if (event.status === "cancelled") { res.status(400).json({ message: "Event is cancelled." }); return; }
    if (event.registrationDeadline && event.registrationDeadline < new Date()) {
      res.status(400).json({ message: "Registration deadline has passed." }); return;
    }

    const existing = await Registration.findOne({ eventId, userId: req.userId });
    if (existing && existing.status !== "cancelled") {
      res.status(409).json({ message: "Already registered for this event." }); return;
    }

    const status = event.capacity && event.currentAttendees >= event.capacity ? "waitlisted" : "confirmed";

    let registration;
    if (existing) {
      existing.status = status;
      existing.cancelledAt = null;
      await existing.save();
      registration = existing;
    } else {
      registration = new Registration({ eventId, userId: req.userId, status });
      await registration.save();
    }

    if (status === "confirmed") {
      await Event.findByIdAndUpdate(eventId, { $inc: { currentAttendees: 1 } });
    }

    await registration.populate([
      { path: "eventId", select: "title slug bannerUrl startDate endDate city status category" },
      { path: "userId", select: "email name" },
    ]);

    res.status(201).json({ data: registration, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/registrations/:eventId/cancel
export const cancelRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registration = await Registration.findOne({ eventId: req.params.eventId, userId: req.userId });
    if (!registration) { res.status(404).json({ message: "Registration not found." }); return; }
    if (registration.status === "cancelled") { res.status(400).json({ message: "Already cancelled." }); return; }

    const wasConfirmed = registration.status === "confirmed";
    registration.status = "cancelled";
    registration.cancelledAt = new Date();
    await registration.save();

    if (wasConfirmed) {
      await Event.findByIdAndUpdate(req.params.eventId, { $inc: { currentAttendees: -1 } });
    }

    res.json({ data: null, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/registrations/my
export const getUserRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.find({ userId: req.userId, status: "confirmed" })
      .populate("eventId", "title slug bannerUrl startDate endDate city status category")
      .sort({ registeredAt: -1 })
      .lean();
    res.json({ data: registrations, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/registrations/event/:eventId
export const getEventRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.find({ eventId: req.params.eventId, status: { $ne: "cancelled" } })
      .populate("userId", "email name")
      .sort({ registeredAt: -1 })
      .lean();
    res.json({ data: registrations, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};
