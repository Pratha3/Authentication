import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export type RegistrationStatus = "confirmed" | "waitlisted" | "cancelled";

// Attendee form answers (flexible key-value for custom event questions)
export interface IAttendeeDetails {
  phone?: string;
  dietaryRequirements?: string;
  tShirtSize?: string;
  emergencyContact?: string;
  specialRequests?: string;
  answers?: Record<string, string>; // custom event questions
}

export interface IRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: RegistrationStatus;
  ticketCode: string;
  attendeeDetails: IAttendeeDetails;
  checkInTime: Date | null;
  checkedIn: boolean;
  registeredAt: Date;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const attendeeDetailsSchema = new Schema<IAttendeeDetails>(
  {
    phone: { type: String, trim: true, default: null },
    dietaryRequirements: { type: String, trim: true, maxlength: 500, default: null },
    tShirtSize: { type: String, trim: true, maxlength: 30, default: null },
    emergencyContact: { type: String, trim: true, maxlength: 120, default: null },
    specialRequests: { type: String, trim: true, maxlength: 1000, default: null },
    answers: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const registrationSchema = new Schema<IRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["confirmed", "waitlisted", "cancelled"],
      default: "confirmed",
    },
    ticketCode: {
      type: String,
      default: () => uuidv4().replace(/-/g, "").slice(0, 10).toUpperCase(),
      // unique index declared below via schema.index() — don't use both
    },
    attendeeDetails: { type: attendeeDetailsSchema, default: () => ({}) },
    checkedIn: { type: Boolean, default: false },
    checkInTime: { type: Date, default: null },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ userId: 1, status: 1 });
registrationSchema.index({ eventId: 1, status: 1, registeredAt: 1 });
registrationSchema.index({ ticketCode: 1 }, { unique: true });

export const Registration = mongoose.model<IRegistration>("Registration", registrationSchema);
