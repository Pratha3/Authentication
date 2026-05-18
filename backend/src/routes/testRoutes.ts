/**
 * Test-only routes — only active in development mode.
 * Remove or protect these before deploying to production.
 */
import { Router, Request, Response } from "express";
import { protect } from "../middleware/auth";
import { sendWhatsApp } from "../services/whatsapp.service";
import { sendEmail } from "../services/email.service";

const router = Router();

// POST /api/test/whatsapp
// Body: { "to": "+919876543210" }
router.post("/whatsapp", protect, async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ message: "Not available in production." });
    return;
  }

  const { to } = req.body;
  if (!to) { res.status(400).json({ message: "to (phone number) is required." }); return; }

  const sent = await sendWhatsApp({
    to,
    type: "confirmation",
    eventTitle: "Test Event — EventSphere",
    attendeeName: "Test User",
    ticketCode: "TESTABCD",
    eventDate: new Date().toLocaleString("en-IN"),
    eventUrl: `${process.env.CLIENT_URL}/events/test`,
  });

  res.json({
    success: sent,
    provider: process.env.WHATSAPP_PROVIDER ?? "not configured",
    message: sent
      ? "WhatsApp message sent successfully!"
      : "Failed to send. Check WHATSAPP_PROVIDER and credentials in .env",
  });
});

// POST /api/test/email
// Body: { "to": "user@example.com" }
router.post("/email", protect, async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ message: "Not available in production." });
    return;
  }

  const { to } = req.body;
  if (!to) { res.status(400).json({ message: "to (email) is required." }); return; }

  const sent = await sendEmail({
    to,
    subject: "✅ EventSphere — Email Test",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#18181b;color:#f1f1f1;border-radius:12px">
        <h2 style="color:#818cf8">Email is working! 🎉</h2>
        <p>Your EventSphere email configuration is set up correctly.</p>
        <p style="color:#71717a;font-size:13px">Sent via Nodemailer · EventSphere</p>
      </div>
    `,
  });

  res.json({
    success: sent,
    emailUser: process.env.EMAIL_USER ?? "not configured",
    message: sent
      ? "Email sent successfully!"
      : "Failed to send. Check EMAIL_USER and EMAIL_PASS in .env",
  });
});

export default router;
