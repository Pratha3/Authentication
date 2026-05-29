import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadFile } from "../controllers/uploadController";
import { protect } from "../middleware/auth";

const allowedBuckets = new Set(["event-images", "avatars", "organizer-assets"]);
const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const bucket = String(req.params.bucket || "misc");
    const dir = path.join(process.cwd(), "uploads", bucket);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = extensionByMime[file.mimetype] || path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    cb(null, Boolean(extensionByMime[file.mimetype]));
  },
});

const router = Router();
router.post("/:bucket", protect, (req, res, next) => {
  const bucket = String(req.params.bucket || "");
  if (!allowedBuckets.has(bucket)) {
    res.status(400).json({ message: "Invalid upload bucket." });
    return;
  }
  next();
}, upload.single("file"), uploadFile);

export default router;
