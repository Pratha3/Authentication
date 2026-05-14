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
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: null },
    country: { type: String, required: true, default: "India" },
    zipCode: { type: String, default: null },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    capacity: { type: Number, default: null },
    description: { type: String, default: null },
    amenities: [{ type: String }],
    images: [{ type: String }],
  },
  { timestamps: true }
);

export const Venue = mongoose.model<IVenue>("Venue", venueSchema);
