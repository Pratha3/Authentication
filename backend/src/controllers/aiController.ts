import { Request, Response } from "express";
import { generateGlobalChatReply } from "../services/ai.service";

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
