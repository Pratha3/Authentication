import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  text: string;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      maxlength: [500, "Message cannot exceed 500 characters"],
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatMessageSchema.index({ eventId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model<IChatMessage>("ChatMessage", chatMessageSchema);
