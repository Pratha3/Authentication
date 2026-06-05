import { Request, Response } from "express";
import mongoose from "mongoose";
import { Event } from "../models/Event";
import { Organizer } from "../models/Organizer";
import { Registration } from "../models/Registration";
import { Bookmark } from "../models/Bookmark";
import { AuthRequest } from "../middleware/auth";
import { emitEventStatusUpdate, emitAttendeeUpdate } from "../sockets/io";

function isValidId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GET /api/events ──────────────────────────────────────────────────────────
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category, dateFrom, dateTo, isFree,
      status = "upcoming,live",
      search, sortBy = "date",
      page = "1", pageSize = "12",
      latitude, longitude, distance,
    } = req.query as Record<string, string>;

    const userId = (req as AuthRequest).userId;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.min(50, parseInt(pageSize) || 12);
    const skip = (pageNum - 1) * pageSizeNum;

    const filter: Record<string, unknown> = {
      status: { $in: status.split(",").map((s) => s.trim()).filter(Boolean) },
    };
    if (category) filter.category = { $in: category.split(",").map((c) => c.trim()) };
    if (dateFrom) filter.startDate = { $gte: new Date(dateFrom) };
    if (dateTo) filter.startDate = { ...(filter.startDate as object ?? {}), $lte: new Date(dateTo) };
    if (isFree !== undefined && isFree !== "") filter.isFree = isFree === "true";
    if (search) filter.$text = { $search: search };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      date: { startDate: 1 },
      popularity: { currentAttendees: -1 },
      newest: { createdAt: -1 },
      distance: { startDate: 1 },
    };
    const sort = sortMap[sortBy] ?? { startDate: 1 };

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizerId", "organizationName logoUrl verificationStatus")
        .populate("venueId", "name address city latitude longitude")
        .sort(sort)
        .skip(skip)
        .limit(pageSizeNum)
        .lean(),
      Event.countDocuments(filter),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enriched: any[] = events;
    if (userId) {
      const ids = events.map((e) => e._id);
      const [regs, bms] = await Promise.all([
        Registration.find({ userId, eventId: { $in: ids }, status: { $ne: "cancelled" } }).select("eventId").lean(),
        Bookmark.find({ userId, eventId: { $in: ids } }).select("eventId").lean(),
      ]);
      const regSet = new Set(regs.map((r) => String(r.eventId)));
      const bmSet = new Set(bms.map((b) => String(b.eventId)));
      enriched = enriched.map((e) => ({
        ...e,
        isRegistered: regSet.has(String(e._id)),
        isBookmarked: bmSet.has(String(e._id)),
      }));
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const maxDist = distance ? parseFloat(distance) : undefined;
      enriched = enriched
        .map((e) => ({
          ...e,
          distance: e.latitude != null && e.longitude != null
            ? calculateDistance(lat, lon, e.latitude, e.longitude)
            : undefined,
        }))
        .filter((e) => !maxDist || (e.distance !== undefined && e.distance <= maxDist));
      if (sortBy === "distance") enriched.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    }

    res.json({ data: enriched, count: total, page: pageNum, pageSize: pageSizeNum, hasMore: skip + pageSizeNum < total });
  } catch (err) {
    console.error("GET EVENTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch events." });
  }
};

// ─── GET /api/events/featured ─────────────────────────────────────────────────
export const getFeaturedEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find({ status: { $in: ["upcoming", "live"] }, isFeatured: true })
      .populate("organizerId", "organizationName logoUrl verificationStatus")
      .populate("venueId", "name city")
      .sort({ isFeatured: -1, createdAt: -1, startDate: 1 })
      .limit(6)
      .lean();
    res.json({ data: events, error: null });
  } catch (err) {
    console.error("GET FEATURED ERROR:", err);
    res.status(500).json({ message: "Failed to fetch featured events." });
  }
};

// ─── GET /api/events/nearby ───────────────────────────────────────────────────
export const getNearbyEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, radius = "10" } = req.query as Record<string, string>;
    if (!latitude || !longitude) {
      res.status(400).json({ message: "latitude and longitude are required." });
      return;
    }
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    const events = await Event.find({
      status: { $in: ["upcoming", "live"] },
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
    })
      .populate("organizerId", "organizationName logoUrl")
      .sort({ startDate: 1 })
      .limit(100)
      .lean();

    const nearby = events
      .map((e) => ({ ...e, distance: calculateDistance(lat, lon, e.latitude!, e.longitude!) }))
      .filter((e) => e.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    res.json({ data: nearby, error: null });
  } catch (err) {
    console.error("GET NEARBY ERROR:", err);
    res.status(500).json({ message: "Failed to fetch nearby events." });
  }
};

// ─── GET /api/events/organizer/:organizerId ───────────────────────────────────
export const getOrganizerEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizerId = String(req.params.organizerId);

    // Validate ObjectId before touching Mongoose to avoid CastError
    if (!organizerId || !isValidId(organizerId)) {
      res.status(400).json({ message: "Invalid organizer ID." });
      return;
    }

    // Primary query: find events by Organizer._id
    // Fallback: if no events found, also check by userId (backward compatibility
    // with events that may have been created before the organizer lookup was added)
    let events = await Event.find({ organizerId: new mongoose.Types.ObjectId(organizerId) })
      .populate("organizerId", "organizationName logoUrl verificationStatus")
      .populate("venueId", "name city")
      .sort({ createdAt: -1 })
      .lean();

    // Fallback: if the passed ID is a user's ID, find their organizer then get events
    if (events.length === 0) {
      const organizer = await Organizer.findOne({ userId: organizerId }).lean();
      if (organizer) {
        events = await Event.find({ organizerId: organizer._id })
          .populate("organizerId", "organizationName logoUrl verificationStatus")
          .populate("venueId", "name city")
          .sort({ createdAt: -1 })
          .lean();
      }
    }

    res.json({ data: events, error: null });
  } catch (err) {
    console.error("GET ORGANIZER EVENTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch organizer events." });
  }
};

// ─── GET /api/events/:slug ────────────────────────────────────────────────────
export const getEventBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slugOrId = String(req.params.slug);
    const query = isValidId(slugOrId)
      ? { $or: [{ slug: slugOrId }, { _id: new mongoose.Types.ObjectId(slugOrId) }] }
      : { slug: slugOrId };

    const event = await Event.findOne(query)
      .populate("organizerId", "organizationName logoUrl verificationStatus")
      .populate("venueId", "name address city latitude longitude")
      .lean();

    if (!event) {
      res.status(404).json({ data: null, error: "Event not found" });
      return;
    }

    const userId = (req as AuthRequest).userId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enriched: any = event;
    if (userId) {
      const [reg, bm] = await Promise.all([
        Registration.findOne({ eventId: event._id, userId, status: { $ne: "cancelled" } }).lean(),
        Bookmark.findOne({ eventId: event._id, userId }).lean(),
      ]);
      enriched = { ...event, isRegistered: !!reg, isBookmarked: !!bm };
    }

    Event.findByIdAndUpdate(event._id, { $inc: { viewCount: 1 } }).exec().catch(() => {});
    res.json({ data: enriched, error: null });
  } catch (err) {
    console.error("GET EVENT BY SLUG ERROR:", err);
    res.status(500).json({ message: "Failed to fetch event." });
  }
};

// ─── POST /api/events ─────────────────────────────────────────────────────────
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizer = await Organizer.findOne({ userId: req.userId });
    if (!organizer) {
      res.status(403).json({ message: "You need an organizer profile to create events." });
      return;
    }

    const body = { ...req.body };
    if (!body.slug && body.title) {
      body.slug = body.title
        .toLowerCase().trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        + "-" + Date.now();
    }

    const event = new Event({ ...body, organizerId: organizer._id });
    await event.save();

    await Organizer.findByIdAndUpdate(organizer._id, { $inc: { totalEvents: 1 } });

    const created = await Event.findById(event._id)
      .populate("organizerId", "organizationName logoUrl verificationStatus")
      .populate("venueId", "name address city latitude longitude")
      .lean();

    res.status(201).json({ data: created, error: null });
  } catch (err: any) {
    console.error("CREATE EVENT ERROR:", err);
    if (err.code === 11000) {
      res.status(409).json({ message: "An event with this slug already exists. Please change the title." });
      return;
    }
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e: any) => e.message).join(", ");
      res.status(400).json({ message: messages });
      return;
    }
    res.status(500).json({ message: "Failed to create event." });
  }
};

// ─── PATCH /api/events/:id ────────────────────────────────────────────────────
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isValidId(String(req.params.id))) {
      res.status(400).json({ message: "Invalid event ID." });
      return;
    }

    const event = await Event.findById(String(req.params.id));
    if (!event) { res.status(404).json({ message: "Event not found." }); return; }

    const organizer = await Organizer.findOne({ userId: req.userId });
    if (!organizer || String(event.organizerId) !== String(organizer._id)) {
      res.status(403).json({ message: "Not authorized to edit this event." });
      return;
    }

    const prevStatus = event.status;
    Object.assign(event, req.body);
    await event.save();

    if (req.body.status && req.body.status !== prevStatus) {
      emitEventStatusUpdate(String(event._id), event.status);
      // Notify all registered attendees of status change (fire-and-forget)
      import("../services/notification.service").then(({ notifyEventStatusUpdate }) => {
        const { Registration } = require("../models/Registration");
        Registration.find({ eventId: event._id, status: { $ne: "cancelled" } })
          .distinct("userId")
          .then((userIds: string[]) => notifyEventStatusUpdate(event, userIds.map(String)))
          .catch(() => {});
      }).catch(() => {});
    }

    const updated = await Event.findById(event._id)
      .populate("organizerId", "organizationName logoUrl verificationStatus")
      .lean();

    res.json({ data: updated, error: null });
  } catch (err: any) {
    console.error("UPDATE EVENT ERROR:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e: any) => e.message).join(", ");
      res.status(400).json({ message: messages });
      return;
    }
    res.status(500).json({ message: "Failed to update event." });
  }
};

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isValidId(String(req.params.id))) {
      res.status(400).json({ message: "Invalid event ID." });
      return;
    }

    const event = await Event.findById(String(req.params.id));
    if (!event) { res.status(404).json({ message: "Event not found." }); return; }

    const organizer = await Organizer.findOne({ userId: req.userId });
    if (!organizer || String(event.organizerId) !== String(organizer._id)) {
      res.status(403).json({ message: "Not authorized to delete this event." });
      return;
    }

    await event.deleteOne();
    await Organizer.findByIdAndUpdate(organizer._id, { $inc: { totalEvents: -1 } });

    res.json({ data: null, error: null });
  } catch (err) {
    console.error("DELETE EVENT ERROR:", err);
    res.status(500).json({ message: "Failed to delete event." });
  }
};
