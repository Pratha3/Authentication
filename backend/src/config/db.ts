import mongoose from "mongoose";
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/authDB");
    console.log("connected a mongodb");
  } catch (error) {
    console.error("db connection error:", error);
    process.exit(1);
  }
};
