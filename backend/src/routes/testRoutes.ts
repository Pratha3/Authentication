/**
 * Test routes — dev-only, mounted at /api/test
 * Use these to verify WhatsApp and SMS config without running a full registration.
 *
 * All routes require a valid JWT (protect middleware).
 */
import { Router, Request, Response } from "express";
import { protect } from "../middleware/auth";
import { sendWhatsApp } from "../services/whatsapp.service";
import { sendSms } from "../services/sms.service";
import { isWhatsAppReady } from "../services/whatsapp-client.service";

const router = Router();

const guard = (_req: Request, res: Response, next: () => void) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ message: "Test routes disabled in production." });
    return;
  }
  next();
};

// ── POST /api/test/whatsapp ──────────────────────────────────────────────────
// Body: { "to": "+919876543210" }
router.post("/whatsapp", guard, protect, async (req: Request, res: Response) => {
  const { to } = req.body;
  if (!to) { res.status(400).json({ message: '"to" phone number is required (E.164: +91XXXXXXXXXX)' }); return; }

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
    provider: process.env.WHATSAPP_PROVIDER || "disabled",
    to,
    message: sent
      ? `WhatsApp sent to ${to}`
      : "WhatsApp not sent — check WHATSAPP_PROVIDER, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env",
  });
});

// ── POST /api/test/sms ───────────────────────────────────────────────────────
// Body: { "to": "+919876543210" }
router.post("/sms", guard, protect, async (req: Request, res: Response) => {
  const { to } = req.body;
  if (!to) { res.status(400).json({ message: '"to" phone number is required (E.164: +91XXXXXXXXXX)' }); return; }

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
    to,
    message: sent
      ? `SMS sent to ${to}`
      : "SMS not sent — check SMS_ENABLED=true, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM in .env",
  });
});

// ── POST /api/test/both ──────────────────────────────────────────────────────
// Fires WhatsApp + SMS simultaneously to the same number
// Body: { "to": "+919876543210" }
router.post("/both", guard, protect, async (req: Request, res: Response) => {
  const { to } = req.body;
  if (!to) { res.status(400).json({ message: '"to" phone number is required' }); return; }

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
      provider: process.env.WHATSAPP_PROVIDER || "disabled",
    },
    sms: {
      sent: smsResult.status === "fulfilled" && smsResult.value,
      enabled: process.env.SMS_ENABLED === "true",
    },
  });
});

// ── GET /api/test/status ─────────────────────────────────────────────────────
router.get("/status", guard, protect, (_req: Request, res: Response) => {
  const waProvider = (process.env.WHATSAPP_PROVIDER ?? "").toLowerCase();
  res.json({
    whatsapp: {
      provider: waProvider || "disabled",
      ...(waProvider === "baileys" && {
        baileysConnected: isWhatsAppReady() ? "✅ connected" : "❌ not connected — scan QR in terminal",
      }),
      ...(waProvider === "twilio" && {
        accountSid:  process.env.TWILIO_ACCOUNT_SID   ? "✅ set" : "❌ missing",
        authToken:   process.env.TWILIO_AUTH_TOKEN    ? "✅ set" : "❌ missing",
        fromNumber:  process.env.TWILIO_WHATSAPP_FROM || "❌ missing",
      }),
      ...(waProvider === "meta" && {
        token:       process.env.META_WHATSAPP_TOKEN  ? "✅ set" : "❌ missing",
        phoneNumId:  process.env.META_PHONE_NUMBER_ID || "❌ missing",
      }),
    },
    sms: {
      enabled:   process.env.SMS_ENABLED === "true" ? "✅ enabled" : "❌ disabled",
      provider:  process.env.SMS_PROVIDER || "not set",
      ...(process.env.SMS_PROVIDER === "fast2sms" && {
        apiKey:  process.env.FAST2SMS_API_KEY ? "✅ set" : "❌ missing",
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

export default router;
