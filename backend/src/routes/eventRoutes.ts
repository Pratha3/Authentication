import { Router } from "express";
import {
  getEvents, getFeaturedEvents, getNearbyEvents,
  getEventBySlug, createEvent, updateEvent, deleteEvent, getOrganizerEvents,
} from "../controllers/eventController";
import { protect, optionalProtect } from "../middleware/auth";

const router = Router();

// ── Static/specific routes MUST come before /:slug ───────────────────────────
router.get("/", optionalProtect, getEvents);
router.get("/featured", getFeaturedEvents);
router.get("/nearby", getNearbyEvents);
router.get("/organizer/:organizerId", getOrganizerEvents);

// ── CRUD ──────────────────────────────────────────────────────────────────────
router.post("/", protect, createEvent);
router.patch("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

// ── Dynamic slug — MUST be last ───────────────────────────────────────────────
router.get("/:slug", optionalProtect, getEventBySlug);

export default router;
