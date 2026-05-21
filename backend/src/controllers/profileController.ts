import { Response } from "express";
import { Profile } from "../models/Profile";
import { Organizer } from "../models/Organizer";
import { AuthRequest } from "../middleware/auth";

// GET /api/profiles/:userId
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) { res.status(404).json({ message: "Profile not found." }); return; }
    res.json({ data: profile, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/profiles/:userId
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.userId !== req.params.userId) {
      res.status(403).json({ message: "Not authorized to update this profile." }); return;
    }
    const allowed = ["fullName", "avatarUrl", "bio", "phone", "location", "latitude", "longitude", "interests"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) { if (req.body[key] !== undefined) update[key] = req.body[key]; }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: update },
      { new: true, upsert: false }
    );
    if (!profile) { res.status(404).json({ message: "Profile not found." }); return; }
    res.json({ data: profile, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/profiles/organizer/:userId
export const getOrganizerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizer = await Organizer.findOne({ userId: req.params.userId })
      .populate("userId", "email name");
    if (!organizer) { res.status(404).json({ message: "Organizer not found." }); return; }
    res.json({ data: organizer, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// POST /api/profiles/organizer
export const createOrganizerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await Organizer.findOne({ userId: req.userId });
    if (existing) { res.status(409).json({ message: "Organizer profile already exists." }); return; }

    const organizer = new Organizer({ userId: req.userId, ...req.body });
    await organizer.save();

    // Upgrade role
    await Profile.findOneAndUpdate({ userId: req.userId }, { $set: { role: "organizer" } });

    res.status(201).json({ data: organizer, error: null });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/profiles/admin/users
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const caller = await Profile.findOne({ userId: req.userId });
    if (!caller || caller.role !== "admin") {
      res.status(403).json({ message: "Admin access required." });
      return;
    }
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const [data, count] = await Promise.all([
      Profile.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Profile.countDocuments(),
    ]);
    res.json({ data, count });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
};
