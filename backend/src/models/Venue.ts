import mongoose, { Document, Schema } from "mongoose";

export interface IVenue extends Document {
  organizerId: mongoose.Types.ObjectId | null;
  name: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  zipCode: string | null;
  latitude: number;
  longitude: number;
  capacity: number | null;
  description: string | null;
  amenities: string[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const venueSchema = new Schema<IVenue>(
  {
    organizerId: { type: Schema.Types.ObjectId, ref: "Organizer", default: null },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true, default: null },
    country: { type: String, required: true, trim: true, default: "India" },
    zipCode: { type: String, trim: true, default: null },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    capacity: { type: Number, default: null, min: 0 },
    description: { type: String, maxlength: 2000, default: null },
    amenities: [{ type: String, trim: true }],
    images: [{ type: String }],
  },
  { timestamps: true }
);

venueSchema.index({ organizerId: 1, createdAt: -1 });
venueSchema.index({ city: 1, name: 1 });
venueSchema.index({ latitude: 1, longitude: 1 });

export const Venue = mongoose.model<IVenue>("Venue", venueSchema);
