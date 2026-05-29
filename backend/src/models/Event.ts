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
    category: {
      type: String,
      enum: [
        "marathon", "meetup", "cafe", "club", "community",
        "music", "sports", "tech", "food", "art",
        "wellness", "business", "outdoor", "workshop", "charity", "other",
      ],
      required: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
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
    latitude: { type: Number, default: null, min: -90, max: 90 },
    longitude: { type: Number, default: null, min: -180, max: 180 },
    capacity: { type: Number, default: null, min: 0 },
    currentAttendees: { type: Number, default: 0, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
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

// Cross-field validation
eventSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date must be after or equal to start date");
  }
  if (this.capacity !== null && this.currentAttendees > this.capacity) {
    this.invalidate("currentAttendees", "Current attendees cannot exceed capacity");
  }
  if (this.registrationDeadline && this.startDate && this.registrationDeadline > this.startDate) {
    this.invalidate("registrationDeadline", "Registration deadline must be before the event starts");
  }
});

// Text index for search
eventSchema.index({ title: "text", description: "text", tags: "text" });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ category: 1, startDate: 1 });
eventSchema.index({ isFeatured: 1 });
eventSchema.index({ organizerId: 1, createdAt: -1 });
eventSchema.index({ city: 1, startDate: 1 });
eventSchema.index({ latitude: 1, longitude: 1 });

export const Event = mongoose.model<IEvent>("Event", eventSchema);
