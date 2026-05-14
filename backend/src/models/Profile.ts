import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "user" | "organizer" | "admin";
export type EventCategory =
  | "marathon" | "meetup" | "cafe" | "club" | "community"
  | "music" | "sports" | "tech" | "food" | "art"
  | "wellness" | "business" | "outdoor" | "workshop" | "charity" | "other";

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  bio: string | null;
  phone: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  interests: EventCategory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    fullName: { type: String, trim: true, default: null },
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: ["user", "organizer", "admin"], default: "user" },
    bio: { type: String, default: null },
    phone: { type: String, default: null },
    location: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    interests: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Profile = mongoose.model<IProfile>("Profile", profileSchema);
