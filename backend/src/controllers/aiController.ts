import { Request, Response } from "express";
import { generateGlobalChatReply } from "../services/ai.service";

// ─── POST /api/ai/chat ──────────────────────────────────────────────
export const globalChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ message: "Message is required." });
      return;
    }

    const reply = await generateGlobalChatReply(message);
    res.json({ reply });
  } catch (err) {
    console.error("GLOBAL CHAT ERROR:", err);
    res.status(500).json({ message: "Failed to process chat." });
  }
};
