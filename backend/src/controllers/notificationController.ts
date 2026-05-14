import { Response } from "express";
import { Notification } from "../models/Notification";
import { AuthRequest } from "../middleware/auth";

// GET /api/notifications
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ data: notifications, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/notifications/:id/read
export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { $set: { isRead: true } });
    res.json({ data: null, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ userId: req.userId, isRead: false }, { $set: { isRead: true } });
    res.json({ data: null, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// POST /api/notifications (internal/admin use)
export const createNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = new Notification({ ...req.body });
    await notification.save();
    res.status(201).json({ data: notification, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};
