import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import path from "path";

// POST /api/upload/:bucket
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ message: "No file uploaded." }); return; }

    const baseUrl = process.env.CLIENT_URL?.replace("5173", "5000") || "http://localhost:5000";
    const bucket = req.params.bucket;
    const filename = req.file.filename;
    const url = `${baseUrl}/uploads/${bucket}/${filename}`;

    res.json({ url, error: null });
  } catch {
    res.status(500).json({ message: "Upload failed." });
  }
};
