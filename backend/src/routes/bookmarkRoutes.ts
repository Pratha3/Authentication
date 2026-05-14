import { Router } from "express";
import { getUserBookmarks, addBookmark, removeBookmark } from "../controllers/bookmarkController";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", protect, getUserBookmarks);
router.post("/", protect, addBookmark);
router.delete("/:eventId", protect, removeBookmark);

export default router;
