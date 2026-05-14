import { Response } from "express";
import { Bookmark } from "../models/Bookmark";
import { AuthRequest } from "../middleware/auth";

// GET /api/bookmarks
export const getUserBookmarks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.userId })
      .populate({
        path: "eventId",
        select: "title slug bannerUrl startDate city status category currentAttendees capacity isFree price",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Remap to match frontend shape
    const mapped = bookmarks.map((b) => ({
      id: b._id,
      userId: b.userId,
      eventId: (b.eventId as any)?._id ?? b.eventId,
      event: b.eventId,
      createdAt: b.createdAt,
    }));

    res.json({ data: mapped, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// POST /api/bookmarks
export const addBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.body;
    if (!eventId) { res.status(400).json({ message: "eventId is required." }); return; }

    const bookmark = new Bookmark({ userId: req.userId, eventId });
    await bookmark.save();
    await bookmark.populate({ path: "eventId", select: "title slug bannerUrl startDate city status category" });

    res.status(201).json({
      data: { id: bookmark._id, userId: bookmark.userId, eventId: bookmark.eventId, event: bookmark.eventId, createdAt: bookmark.createdAt },
      error: null,
    });
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ message: "Already bookmarked." }); return; }
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/bookmarks/:eventId
export const removeBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Bookmark.findOneAndDelete({ userId: req.userId, eventId: req.params.eventId });
    res.json({ data: null, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};
