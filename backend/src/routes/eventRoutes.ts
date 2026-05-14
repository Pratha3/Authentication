import { Router } from "express";
import {
  getEvents, getFeaturedEvents, getNearbyEvents,
  getEventBySlug, createEvent, updateEvent, deleteEvent, getOrganizerEvents,
} from "../controllers/eventController";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", getEvents);
router.get("/featured", getFeaturedEvents);
router.get("/nearby", getNearbyEvents);
router.get("/organizer/:organizerId", getOrganizerEvents);
router.get("/:slug", getEventBySlug);
router.post("/", protect, createEvent);
router.patch("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

export default router;
