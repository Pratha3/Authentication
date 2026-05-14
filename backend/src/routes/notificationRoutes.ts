import { Router } from "express";
import { getNotifications, markRead, markAllRead, createNotification } from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", protect, getNotifications);
router.patch("/read-all", protect, markAllRead);
router.patch("/:id/read", protect, markRead);
router.post("/", protect, createNotification);

export default router;
