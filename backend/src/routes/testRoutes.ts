/**
 * Test routes — dev-only, mounted at /api/test
 * Guarded by NODE_ENV !== "production" + JWT.
 * Rate-limited to prevent accidental spam.
 */
import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/auth";
import { isWhatsAppEnabled, sendWhatsApp } from "../services/whatsapp.service";
import { sendSms } from "../services/sms.service";
import { getQueueStats, processQueue } from "../services/notification-queue.service";
import { normalizePhone } from "../utils/phone.utils";

const router = Router();

// Block in production regardless of env-guard at mount point
const guard = (_req: Request, res: Response, next: () => void) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ message: "Test routes disabled in production." });
    return;
  }
  next();
};

// Max 10 test sends per 15 minutes per IP to avoid accidental spam
const testLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 10,
  message: { message: "Too many test requests — try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── POST /api/test/whatsapp ──────────────────────────────────────────────────
// Body: { "to": "+919876543210" }
router.post("/whatsapp", guard, testLimiter, protect, async (req: Request, res: Response) => {
  const to = normalizePhone(req.body.to);
  if (!to) {
    res.status(400).json({ message: '"to" phone number is required (E.164: +91XXXXXXXXXX)' });
    return;
  }

  const sent = await sendWhatsApp({
    to,
    type: "confirmation",
    eventTitle: "EventSphere Test Event",
    attendeeName: "Test User",
    ticketCode: "TEST1234",
    eventDate: new Date().toLocaleString("en-IN"),
    eventUrl: `${process.env.CLIENT_URL ?? "http://localhost:3000"}/events/test`,
  });

  res.json({
    sent,
    channel: "whatsapp",
    provider: "meta",
    enabled: isWhatsAppEnabled(),
    to,
    message: sent
      ? `✅ WhatsApp sent to ${to}`
      : "❌ Not sent — WhatsApp is disabled unless WHATSAPP_ENABLED=true and Meta env vars are set",
  });
});

// ── POST /api/test/sms ───────────────────────────────────────────────────────
// Body: { "to": "+919876543210" }
router.post("/sms", guard, testLimiter, protect, async (req: Request, res: Response) => {
  const to = normalizePhone(req.body.to);
  if (!to) {
    res.status(400).json({ message: '"to" phone number is required (E.164: +91XXXXXXXXXX)' });
    return;
  }

  const sent = await sendSms({
    to,
    type: "confirmation",
    eventTitle: "EventSphere Test Event",
    attendeeName: "Test User",
    ticketCode: "TEST1234",
    eventDate: new Date().toLocaleString("en-IN"),
    eventUrl: `${process.env.CLIENT_URL ?? "http://localhost:3000"}/events/test`,
  });

  res.json({
    sent,
    channel: "sms",
    smsEnabled: process.env.SMS_ENABLED === "true",
    provider: process.env.SMS_PROVIDER || "not set",
    to,
    message: sent
      ? `✅ SMS sent to ${to}`
      : "❌ Not sent — check SMS_ENABLED=true and SMS_PROVIDER in .env",
  });
});

// ── POST /api/test/both ──────────────────────────────────────────────────────
// Fires WhatsApp + SMS simultaneously — Body: { "to": "+919876543210" }
router.post("/both", guard, testLimiter, protect, async (req: Request, res: Response) => {
  const to = normalizePhone(req.body.to);
  if (!to) {
    res.status(400).json({ message: '"to" phone number is required' });
    return;
  }

  const payload = {
    to,
    type: "confirmation" as const,
    eventTitle: "EventSphere Test Event",
    attendeeName: "Test User",
    ticketCode: "TEST1234",
    eventDate: new Date().toLocaleString("en-IN"),
    eventUrl: `${process.env.CLIENT_URL ?? "http://localhost:3000"}/events/test`,
  };

  const [waResult, smsResult] = await Promise.allSettled([
    sendWhatsApp(payload),
    sendSms(payload),
  ]);

  res.json({
    to,
    whatsapp: {
      sent: waResult.status === "fulfilled" && waResult.value,
      provider: "meta",
      enabled: isWhatsAppEnabled(),
    },
    sms: {
      sent: smsResult.status === "fulfilled" && smsResult.value,
      enabled: process.env.SMS_ENABLED === "true",
      provider: process.env.SMS_PROVIDER || "not set",
    },
  });
});

// ── GET /api/test/status ─────────────────────────────────────────────────────
router.get("/status", guard, protect, (_req: Request, res: Response) => {
  res.json({
    whatsapp: {
      provider: "meta",
      enabled: process.env.WHATSAPP_ENABLED === "true" ? "✅ enabled" : "disabled (set WHATSAPP_ENABLED=true to use Meta)",
      token:       process.env.META_WHATSAPP_TOKEN   ? "✅ set" : "missing",
      phoneNumId:  process.env.META_PHONE_NUMBER_ID  ? "✅ set" : "missing",
      ready: isWhatsAppEnabled(),
    },
    sms: {
      enabled:  process.env.SMS_ENABLED === "true" ? "✅ enabled" : "❌ disabled (set SMS_ENABLED=true)",
      provider: process.env.SMS_PROVIDER || "not set",
      ...(process.env.SMS_PROVIDER === "fast2sms" && {
        apiKey: process.env.FAST2SMS_API_KEY ? "✅ set" : "❌ missing",
      }),
      ...(process.env.SMS_PROVIDER === "twilio" && {
        fromNumber: process.env.TWILIO_SMS_FROM || "❌ missing",
      }),
      ...(process.env.SMS_PROVIDER === "textbelt" && {
        note: "1 free SMS/day — no signup needed",
      }),
    },
  });
});

// ── GET /api/test/queue ──────────────────────────────────────────────────────
router.get("/queue", guard, protect, async (_req: Request, res: Response) => {
  try {
    const stats = await getQueueStats();
    res.json({
      queue: {
        pending:    stats.pending    ?? 0,
        processing: stats.processing ?? 0,
        sent:       stats.sent       ?? 0,
        retrying:   stats.retrying   ?? 0,
        failed:     stats.failed     ?? 0,
        dead:       stats.dead       ?? 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch queue stats.", error: err.message });
  }
});

// ── POST /api/test/queue/drain ───────────────────────────────────────────────
// Manually trigger a queue processing cycle (useful during testing)
router.post("/queue/drain", guard, protect, async (_req: Request, res: Response) => {
  try {
    await processQueue();
    const stats = await getQueueStats();
    res.json({ message: "Queue drain triggered.", queue: stats });
  } catch (err: any) {
    res.status(500).json({ message: "Queue drain failed.", error: err.message });
  }
});

export default router;
