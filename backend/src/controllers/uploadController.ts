import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { env } from "../config/env";

// POST /api/upload/:bucket
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ message: "No file uploaded." }); return; }

    const host = env.BACKEND_URL || `http://localhost:${env.PORT}`;
    const bucket = req.params.bucket;
    const filename = req.file.filename;
    const url = `${host}/uploads/${bucket}/${filename}`;

    res.json({ url, error: null });
  } catch {
    res.status(500).json({ message: "Upload failed." });
  }
};
