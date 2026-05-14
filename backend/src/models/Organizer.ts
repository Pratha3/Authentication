import mongoose, { Document, Schema } from "mongoose";

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface IOrganizer extends Document {
  userId: mongoose.Types.ObjectId;
  organizationName: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  socialLinks: Record<string, string> | null;
  verificationStatus: VerificationStatus;
  verifiedAt: Date | null;
  totalEvents: number;
  followerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const organizerSchema = new Schema<IOrganizer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    organizationName: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    logoUrl: { type: String, default: null },
    website: { type: String, default: null },
    socialLinks: { type: Schema.Types.Mixed, default: null },
    verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    verifiedAt: { type: Date, default: null },
    totalEvents: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Organizer = mongoose.model<IOrganizer>("Organizer", organizerSchema);
