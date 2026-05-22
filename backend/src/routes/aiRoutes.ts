import { Router } from "express";
import { globalChat } from "../controllers/aiController";

const router = Router();

router.post("/chat", globalChat);

export default router;
