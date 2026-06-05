import { Request, Response } from "express";
import { generateGlobalChatReply, generateEventBanner } from "../services/ai.service";

// ─── POST /api/ai/chat ──────────────────────────────────────────────
export const globalChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({ message: "Message is required." });
      return;
    }
    if (message.length > 1000) {
      res.status(400).json({ message: "Message is too long. Please keep it under 1000 characters." });
      return;
    }

    const reply = await generateGlobalChatReply(message.trim());
    res.json({ reply });
  } catch (err) {
    console.error("GLOBAL CHAT ERROR:", err);
    res.status(500).json({ message: "Failed to process chat." });
  }
};

// ─── POST /api/ai/generate-banner ──────────────────────────────────
export const generateBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      res.status(400).json({ message: "Prompt is required." });
      return;
    }

    const imageUrl = await generateEventBanner(prompt.trim());
    const host = `${req.protocol}://${req.get("host")}`;
    res.json({ imageUrl: `${host}${imageUrl}` });
  } catch (err) {
    const error = err as { message?: string };
    console.error("AI GENERATE BANNER ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to generate AI banner." });
  }
};
