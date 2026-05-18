import { Router } from "express";
import {
  registerForEvent,
  cancelRegistration,
  getUserRegistrations,
  getEventRegistrations,
  checkInAttendee,
} from "../controllers/registrationController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/", protect, registerForEvent);
router.get("/my", protect, getUserRegistrations);
router.get("/event/:eventId", protect, getEventRegistrations);
router.patch("/:eventId/cancel", protect, cancelRegistration);
router.patch("/:registrationId/checkin", protect, checkInAttendee);

export default router;
