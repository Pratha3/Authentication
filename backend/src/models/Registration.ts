import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export type RegistrationStatus = "confirmed" | "waitlisted" | "cancelled";

export interface IRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: RegistrationStatus;
  ticketCode: string;
  registeredAt: Date;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["confirmed", "waitlisted", "cancelled"], default: "confirmed" },
    ticketCode: { type: String, default: () => uuidv4().replace(/-/g, "").slice(0, 12).toUpperCase() },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent duplicate registrations
registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ userId: 1 });
registrationSchema.index({ eventId: 1 });

export const Registration = mongoose.model<IRegistration>("Registration", registrationSchema);
