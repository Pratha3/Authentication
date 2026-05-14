import { Request, Response } from "express";
import { Event } from "../models/Event";
import { Registration } from "../models/Registration";
import { Bookmark } from "../models/Bookmark";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/events
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category, dateFrom, dateTo, isFree, status = "upcoming,live",
      search, sortBy = "date", page = "1", pageSize = "12",
      latitude, longitude, distance,
    } = req.query as Record<string, string>;

    const userId = (req as AuthRequest).userId;
    const pageNum = Math.max(1, parseInt(page));
    const pageSizeNum = Math.min(50, parseInt(pageSize));
    const skip = (pageNum - 1) * pageSizeNum;

    const filter: Record<string, unknown> = {
      status: { $in: status.split(",") },
    };

    if (category) filter.category = { $in: category.split(",") };
    if (dateFrom) filter.startDate = { $gte: new Date(dateFrom) };
    if (dateTo) filter.startDate = { ...(filter.startDate as object), $lte: new Date(dateTo) };
    if (isFree !== undefined) filter.isFree = isFree === "true";
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

    // Enrich with user-specific data
    let enriched = events as (typeof events[0] & { isRegistered?: boolean; isBookmarked?: boolean; distance?: number })[];
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

    // Distance filter
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const maxDist = distance ? parseFloat(distance) : undefined;
      enriched = enriched
        .map((e) => ({
          ...e,
          distance: e.latitude && e.longitude ? calculateDistance(lat, lon, e.latitude, e.longitude) : undefined,
        }))
        .filter((e) => !maxDist || (e.distance !== undefined && e.distance <= maxDist));
      if (sortBy === "distance") enriched.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    }

    res.json({ data: enriched, count: total, page: pageNum, pageSize: pageSizeNum, hasMore: skip + pageSizeNum < total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/events/featured
export const getFeaturedEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find({ isFeatured: true, status: { $in: ["upcoming", "live"] } })
      .populate("organizerId", "organizationName logoUrl")
      .populate("venueId", "name city")
      .sort({ startDate: 1 })
      .limit(6)
      .lean();
    res.json({ data: events, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/events/nearby
export const getNearbyEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, radius = "10" } = req.query as Record<string, string>;
    if (!latitude || !longitude) { res.status(400).json({ message: "latitude and longitude required." }); return; }
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    const events = await Event.find({ status: { $in: ["upcoming", "live"] }, latitude: { $ne: null }, longitude: { $ne: null } })
      .populate("organizerId", "organizationName logoUrl")
      .sort({ startDate: 1 })
      .limit(50)
      .lean();

    const nearby = events
      .map((e) => ({ ...e, distance: calculateDistance(lat, lon, e.latitude!, e.longitude!) }))
      .filter((e) => e.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    res.json({ data: nearby, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/events/:slug
export const getEventBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findOne({ slug: req.params.slug })
      .populate("organizerId", "organizationName logoUrl verificationStatus")
      .populate("venueId", "name address city latitude longitude")
      .lean();

    if (!event) { res.status(404).json({ message: "Event not found.", error: "Event not found" }); return; }

    const userId = (req as AuthRequest).userId;
    let enriched: typeof event & { isRegistered?: boolean; isBookmarked?: boolean } = event;
    if (userId) {
      const [reg, bm] = await Promise.all([
        Registration.findOne({ eventId: event._id, userId, status: { $ne: "cancelled" } }),
        Bookmark.findOne({ eventId: event._id, userId }),
      ]);
      enriched = { ...event, isRegistered: !!reg, isBookmarked: !!bm };
    }

    // Increment view count (fire-and-forget)
    Event.findByIdAndUpdate(event._id, { $inc: { viewCount: 1 } }).exec();

    res.json({ data: enriched, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// POST /api/events
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = new Event({ ...req.body, organizerId: req.userId });
    await event.save();
    res.status(201).json({ data: event, error: null });
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ message: "An event with this slug already exists." }); return; }
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/events/:id
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) { res.status(404).json({ message: "Event not found." }); return; }
    if (String(event.organizerId) !== req.userId) { res.status(403).json({ message: "Not authorized." }); return; }
    Object.assign(event, req.body);
    await event.save();
    res.json({ data: event, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/events/:id
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) { res.status(404).json({ message: "Event not found." }); return; }
    if (String(event.organizerId) !== req.userId) { res.status(403).json({ message: "Not authorized." }); return; }
    await event.deleteOne();
    res.json({ data: null, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/events/organizer/:organizerId
export const getOrganizerEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find({ organizerId: req.params.organizerId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data: events, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};
