import { Response } from "express";
import { AuthRequest } from "../middleware/auth";

// POST /api/upload/:bucket
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ message: "No file uploaded." }); return; }

    const port = process.env.PORT || "5000";
    const host = process.env.BACKEND_URL || `http://localhost:${port}`;
    const bucket = req.params.bucket;
    const filename = req.file.filename;
    const url = `${host}/uploads/${bucket}/${filename}`;

    res.json({ url, error: null });
  } catch {
    res.status(500).json({ message: "Upload failed." });
  }
};
