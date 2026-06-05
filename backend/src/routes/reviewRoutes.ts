import { Router } from "express";
import { createReview, getEventReviews } from "../controllers/reviewController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/", protect, createReview);
router.get("/event/:eventId", getEventReviews);

export default router;
