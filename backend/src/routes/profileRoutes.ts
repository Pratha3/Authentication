import { Router } from "express";
import {
  getProfile, updateProfile,
  getOrganizerProfile, createOrganizerProfile, getAllUsers,
} from "../controllers/profileController";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/admin/users", protect, getAllUsers);
router.get("/organizer/:userId", getOrganizerProfile);
router.post("/organizer", protect, createOrganizerProfile);
router.get("/:userId", getProfile);
router.patch("/:userId", protect, updateProfile);

export default router;
