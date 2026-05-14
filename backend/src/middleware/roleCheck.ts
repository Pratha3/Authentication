import { Response, NextFunction } from "express";
import { Profile } from "../models/Profile";
import { AuthRequest } from "./auth";

export const requireRole = (...roles: string[]) =>
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await Profile.findOne({ userId: req.userId }).select("role").lean();
      if (!profile || !roles.includes(profile.role)) {
        res.status(403).json({ message: "Forbidden: insufficient permissions." });
        return;
      }
      next();
    } catch {
      res.status(500).json({ message: "Server error." });
    }
  };
