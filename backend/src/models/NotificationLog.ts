import mongoose, { Document, Schema } from "mongoose";

export type NotificationChannel = "whatsapp" | "sms";
export type NotificationJobStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "retrying"
  | "dead";

export interface INotificationLog extends Document {
  channel: NotificationChannel;
  to: string;
  type: string;
  payload: Record<string, unknown>;
  status: NotificationJobStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: Date | null;
  nextRetryAt: Date | null;
  lastError: string | null;
  sentAt: Date | null;
  userId: string | null;
  eventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationLogSchema = new Schema<INotificationLog>(
  {
    channel: { type: String, enum: ["whatsapp", "sms"], required: true },
    to: { type: String, required: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "failed", "retrying", "dead"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastAttemptAt: { type: Date, default: null },
    nextRetryAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    sentAt: { type: Date, default: null },
    userId: { type: String, default: null },
    eventId: { type: String, default: null },
  },
  { timestamps: true }
);

// Worker query index: fetch pending/retrying jobs due for processing
notificationLogSchema.index({ status: 1, nextRetryAt: 1 });
// Audit queries
notificationLogSchema.index({ channel: 1, to: 1, createdAt: -1 });
notificationLogSchema.index({ eventId: 1, createdAt: -1 });
notificationLogSchema.index({ userId: 1, createdAt: -1 });
notificationLogSchema.index({ createdAt: -1 });

export const NotificationLog = mongoose.model<INotificationLog>(
  "NotificationLog",
  notificationLogSchema
);
