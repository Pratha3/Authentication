import mongoose, { Document, Schema } from "mongoose";

export type EventStatus = "draft" | "upcoming" | "live" | "completed" | "cancelled";
export type EventCategory =
  | "marathon" | "meetup" | "cafe" | "club" | "community"
  | "music" | "sports" | "tech" | "food" | "art"
  | "wellness" | "business" | "outdoor" | "workshop" | "charity" | "other";

export interface IEventImage {
  url: string;
  altText: string | null;
  orderIndex: number;
}

export interface IEvent extends Document {
  organizerId: mongoose.Types.ObjectId;
  venueId: mongoose.Types.ObjectId | null;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  bannerUrl: string | null;
  category: EventCategory;
  tags: string[];
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  timezone: string;
  isOnline: boolean;
  onlineUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  currentAttendees: number;
  price: number;
  currency: string;
  isFree: boolean;
  registrationDeadline: Date | null;
  minAge: number | null;
  maxAge: number | null;
  requirements: string | null;
  isFeatured: boolean;
  viewCount: number;
  images: IEventImage[];
  createdAt: Date;
  updatedAt: Date;
}

const eventImageSchema = new Schema<IEventImage>(
  {
    url: { type: String, required: true },
    altText: { type: String, default: null },
    orderIndex: { type: Number, default: 0 },
  },
  { _id: true }
);

const eventSchema = new Schema<IEvent>(
  {
    organizerId: { type: Schema.Types.ObjectId, ref: "Organizer", required: true },
    venueId: { type: Schema.Types.ObjectId, ref: "Venue", default: null },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    category: { type: String, required: true },
    tags: [{ type: String }],
    status: { type: String, enum: ["draft", "upcoming", "live", "completed", "cancelled"], default: "upcoming" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    isOnline: { type: Boolean, default: false },
    onlineUrl: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    capacity: { type: Number, default: null },
    currentAttendees: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    isFree: { type: Boolean, default: true },
    registrationDeadline: { type: Date, default: null },
    minAge: { type: Number, default: null },
    maxAge: { type: Number, default: null },
    requirements: { type: String, default: null },
    isFeatured: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    images: [eventImageSchema],
  },
  { timestamps: true }
);

// Text index for search
eventSchema.index({ title: "text", description: "text", tags: "text" });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isFeatured: 1 });
eventSchema.index({ organizerId: 1 });

export const Event = mongoose.model<IEvent>("Event", eventSchema);
