import mongoose, { Document, Schema } from "mongoose";

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ userId: 1, eventId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1 });

export const Bookmark = mongoose.model<IBookmark>("Bookmark", bookmarkSchema);
