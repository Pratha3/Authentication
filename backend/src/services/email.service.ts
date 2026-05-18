import nodemailer, { Transporter } from "nodemailer";

// ─── Transporter (singleton) ───────────────────────────────────────────────
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  } else {
    // Fallback: ethereal (dev-only fake SMTP, no config needed)
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: "ethereal-user", pass: "ethereal-pass" },
    });
    console.warn("⚠️  EMAIL_USER/EMAIL_PASS not set — using Ethereal stub (emails won't actually send)");
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (process.env.NODE_ENV === "test") return true; // skip in tests

  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"EventSphere" <${process.env.EMAIL_USER ?? "noreply@eventsphere.app"}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text ?? options.html.replace(/<[^>]+>/g, ""),
    });
    return true;
  } catch (err: any) {
    console.error("Email send error:", err.message);
    return false;
  }
}

// ─── Template builder helpers ─────────────────────────────────────────────
const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px; margin: 0 auto; background: #0f0f10; color: #f1f1f1;
  border-radius: 12px; overflow: hidden;
`;

const headerStyle = `
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 32px 40px; text-align: center;
`;

const bodyStyle = `padding: 32px 40px; background: #18181b;`;

const footerStyle = `
  padding: 20px 40px; background: #0f0f10; text-align: center;
  font-size: 12px; color: #71717a;
`;

const pillStyle = `
  display: inline-block; background: #6366f1; color: white;
  padding: 6px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;
`;

const ticketBoxStyle = `
  background: #27272a; border: 1px dashed #6366f1; border-radius: 10px;
  padding: 20px; text-align: center; margin: 20px 0;
`;

const infoRowStyle = `
  display: flex; align-items: center; gap: 8px; margin: 8px 0;
  font-size: 14px; color: #a1a1aa;
`;

function wrap(content: string): string {
  return `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:16px;background:#09090b;">
      <div style="${baseStyle}">${content}</div>
    </body></html>
  `;
}

// ─── Registration Confirmation (to attendee) ──────────────────────────────
export interface RegistrationEmailData {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketCode: string;
  status: "confirmed" | "waitlisted";
  eventUrl: string;
  organizerName: string;
  isOnline: boolean;
  onlineUrl?: string | null;
}

export function buildRegistrationEmail(data: RegistrationEmailData): string {
  const statusBadge = data.status === "confirmed"
    ? `<span style="${pillStyle}; background:#22c55e;">✓ Confirmed</span>`
    : `<span style="${pillStyle}; background:#f59e0b;">⏳ Waitlisted</span>`;

  const locationLine = data.isOnline
    ? `🌐 Online Event${data.onlineUrl ? ` · <a href="${data.onlineUrl}" style="color:#818cf8;">Join Link</a>` : ""}`
    : `📍 ${data.eventLocation}`;

  return wrap(`
    <div style="${headerStyle}">
      <div style="font-size:32px;margin-bottom:8px;">🎉</div>
      <h1 style="margin:0;font-size:22px;color:white;">
        ${data.status === "confirmed" ? "You're in!" : "You're on the list!"}
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
        ${data.status === "confirmed" ? "Registration confirmed" : "Added to waitlist"}
      </p>
    </div>

    <div style="${bodyStyle}">
      <p style="font-size:16px;margin:0 0 20px;">Hi ${data.attendeeName},</p>

      ${data.status === "confirmed"
        ? `<p style="color:#a1a1aa;">Your registration for <strong style="color:#f1f1f1;">${data.eventTitle}</strong> has been confirmed. Here are your details:</p>`
        : `<p style="color:#a1a1aa;">You've been added to the waitlist for <strong style="color:#f1f1f1;">${data.eventTitle}</strong>. We'll notify you immediately if a spot opens up.</p>`
      }

      <div style="${ticketBoxStyle}">
        <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Your Ticket Code</p>
        <p style="margin:0;font-size:28px;font-weight:700;color:#818cf8;letter-spacing:4px;">${data.ticketCode}</p>
      </div>

      <div style="background:#27272a;border-radius:10px;padding:20px;margin:20px 0;">
        <h3 style="margin:0 0 12px;font-size:16px;">${data.eventTitle}</h3>
        <div style="${infoRowStyle}">📅 ${data.eventDate}</div>
        <div style="${infoRowStyle}">${locationLine}</div>
        <div style="${infoRowStyle}">🎫 By ${data.organizerName}</div>
        <div style="margin-top:12px;">${statusBadge}</div>
      </div>

      <a href="${data.eventUrl}" style="
        display:block; background:linear-gradient(135deg,#6366f1,#8b5cf6);
        color:white; text-decoration:none; text-align:center;
        padding:14px; border-radius:8px; font-weight:600; font-size:15px;
        margin-top:24px;
      ">View Event Details →</a>
    </div>

    <div style="${footerStyle}">
      <p style="margin:0;">EventSphere · Discover events that move you</p>
      <p style="margin:8px 0 0;">Questions? Reply to this email.</p>
    </div>
  `);
}

// ─── Organizer Notification (new registration) ────────────────────────────
export interface OrganizerNotificationData {
  organizerName: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  totalAttendees: number;
  capacity: number | null;
  dashboardUrl: string;
  registrationStatus: "confirmed" | "waitlisted";
}

export function buildOrganizerNotificationEmail(data: OrganizerNotificationData): string {
  const capacityText = data.capacity
    ? `${data.totalAttendees} / ${data.capacity}`
    : String(data.totalAttendees);

  const pctFull = data.capacity ? Math.round((data.totalAttendees / data.capacity) * 100) : 0;
  const barColor = pctFull > 80 ? "#f59e0b" : "#6366f1";

  return wrap(`
    <div style="${headerStyle}">
      <div style="font-size:28px;margin-bottom:8px;">🔔</div>
      <h1 style="margin:0;font-size:20px;color:white;">New Registration!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${data.eventTitle}</p>
    </div>

    <div style="${bodyStyle}">
      <p style="font-size:16px;margin:0 0 20px;">Hi ${data.organizerName},</p>
      <p style="color:#a1a1aa;">
        <strong style="color:#f1f1f1;">${data.attendeeName}</strong>
        (${data.attendeeEmail}) just registered for your event.
        Their status is <strong style="color:${data.registrationStatus === "confirmed" ? "#22c55e" : "#f59e0b"};">
          ${data.registrationStatus}
        </strong>.
      </p>

      <div style="background:#27272a;border-radius:10px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#71717a;">Attendee count</p>
        <p style="margin:0 0 12px;font-size:24px;font-weight:700;">${capacityText}</p>
        ${data.capacity ? `
          <div style="background:#3f3f46;border-radius:999px;height:6px;overflow:hidden;">
            <div style="background:${barColor};height:100%;width:${pctFull}%;border-radius:999px;"></div>
          </div>
          <p style="margin:6px 0 0;font-size:12px;color:#71717a;">${pctFull}% full</p>
        ` : ""}
      </div>

      <a href="${data.dashboardUrl}" style="
        display:block; background:linear-gradient(135deg,#6366f1,#8b5cf6);
        color:white; text-decoration:none; text-align:center;
        padding:14px; border-radius:8px; font-weight:600; font-size:15px;
      ">View Attendees →</a>
    </div>

    <div style="${footerStyle}">
      <p style="margin:0;">EventSphere Organizer Dashboard</p>
    </div>
  `);
}

// ─── Registration Cancellation ─────────────────────────────────────────────
export function buildCancellationEmail(data: {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventUrl: string;
}): string {
  return wrap(`
    <div style="${headerStyle}; background:linear-gradient(135deg,#dc2626,#b91c1c);">
      <div style="font-size:28px;margin-bottom:8px;">❌</div>
      <h1 style="margin:0;font-size:20px;color:white;">Registration Cancelled</h1>
    </div>
    <div style="${bodyStyle}">
      <p>Hi ${data.attendeeName},</p>
      <p style="color:#a1a1aa;">Your registration for <strong style="color:#f1f1f1;">${data.eventTitle}</strong>
      on <strong style="color:#f1f1f1;">${data.eventDate}</strong> has been cancelled.</p>
      <p style="color:#a1a1aa;">If this was a mistake, you can re-register below while spots are available.</p>
      <a href="${data.eventUrl}" style="
        display:block; background:#27272a; border:1px solid #6366f1;
        color:#818cf8; text-decoration:none; text-align:center;
        padding:14px; border-radius:8px; font-weight:600; margin-top:20px;
      ">Re-register →</a>
    </div>
    <div style="${footerStyle}"><p style="margin:0;">EventSphere</p></div>
  `);
}

// ─── Event Reminder ────────────────────────────────────────────────────────
export function buildReminderEmail(data: {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketCode: string;
  eventUrl: string;
  hoursUntil: number;
}): string {
  return wrap(`
    <div style="${headerStyle}">
      <div style="font-size:28px;margin-bottom:8px;">⏰</div>
      <h1 style="margin:0;font-size:20px;color:white;">Event Reminder</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);">
        ${data.hoursUntil <= 24 ? "Tomorrow!" : `In ${Math.round(data.hoursUntil / 24)} days`}
      </p>
    </div>
    <div style="${bodyStyle}">
      <p>Hi ${data.attendeeName},</p>
      <p style="color:#a1a1aa;">
        Don't forget — <strong style="color:#f1f1f1;">${data.eventTitle}</strong> is coming up!
      </p>
      <div style="${ticketBoxStyle}">
        <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Your Ticket</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:#818cf8;letter-spacing:3px;">${data.ticketCode}</p>
      </div>
      <div style="${infoRowStyle}">📅 ${data.eventDate}</div>
      <div style="${infoRowStyle}">📍 ${data.eventLocation}</div>
      <a href="${data.eventUrl}" style="
        display:block; background:linear-gradient(135deg,#6366f1,#8b5cf6);
        color:white; text-decoration:none; text-align:center;
        padding:14px; border-radius:8px; font-weight:600; margin-top:24px;
      ">View Event →</a>
    </div>
    <div style="${footerStyle}"><p style="margin:0;">EventSphere</p></div>
  `);
}
