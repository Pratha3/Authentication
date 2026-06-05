import { Router } from "express";
import { globalChat, generateBanner } from "../controllers/aiController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/chat", globalChat);
router.post("/generate-banner", protect, generateBanner);

export default router;
