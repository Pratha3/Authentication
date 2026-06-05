import { Request, Response } from "express";
import mongoose from "mongoose";
import { Review } from "../models/Review";
import { Registration } from "../models/Registration";
import { Event } from "../models/Event";
import { User } from "../models/User";
import type { AuthRequest } from "../middleware/auth";

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.body;
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!eventId || !mongoose.isValidObjectId(eventId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
      res.status(400).json({ message: "eventId, rating, and comment are required." });
      return;
    }

    // 1. Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }
    if (event.status !== "completed" && event.startDate > new Date()) {
      res.status(400).json({ message: "Reviews can be submitted after the event starts." });
      return;
    }

    // 2. Check if user is registered and confirmed
    const registration = await Registration.findOne({
      eventId,
      userId,
      status: "confirmed"
    });
    if (!registration) {
      res.status(403).json({ message: "Only registered attendees can review this event." });
      return;
    }

    // 3. Prevent reviewing double
    const existingReview = await Review.findOne({ eventId, userId });
    if (existingReview) {
      res.status(400).json({ message: "You have already reviewed this event." });
      return;
    }

    // Fetch user details for name
    const user = await User.findById(userId);
    const userName = user?.name || user?.email.split("@")[0] || "Anonymous";

    // 4. Create review
    const review = await Review.create({
      eventId,
      userId,
      userName,
      rating,
      comment
    });

    res.status(201).json({ review });
  } catch (err: unknown) {
    console.error("CREATE REVIEW ERROR:", err);
    if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ message: "You have already reviewed this event." });
      return;
    }
    res.status(500).json({ message: "Failed to create review." });
  }
};

export const getEventReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!eventId || !mongoose.isValidObjectId(eventId)) {
      res.status(400).json({ message: "Valid eventId is required." });
      return;
    }

    const reviews = await Review.find({ eventId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reviews });
  } catch (err) {
    console.error("GET REVIEWS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
};
