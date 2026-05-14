import { Request, Response } from "express";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { AuthRequest } from "../middleware/auth";

// ─── Helper: generate signed JWT ────────────────────────────────────────────
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
};

// ─── Helper: build nodemailer transporter ───────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ─── 1. SIGNUP ───────────────────────────────────────────────────────────────
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name?.trim(),
    });
    await newUser.save();

    // Auto-create profile
    await Profile.create({
      userId: newUser._id,
      email: email.toLowerCase(),
      fullName: name?.trim() ?? null,
    });

    const token = generateToken(String(newUser._id));

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (err: any) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ message: "An unexpected error occurred. Please try again." });
  }
};

// ─── 2. LOGIN ────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Generic message to prevent user enumeration
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const token = generateToken(String(user._id));

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err: any) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "An unexpected error occurred. Please try again." });
  }
};

// ─── 3. GET CURRENT USER (protected) ─────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    res.status(200).json({ user });
  } catch (err: any) {
    console.error("GET ME ERROR:", err);
    res.status(500).json({ message: "An unexpected error occurred." });
  }
};

// ─── 4. FORGOT PASSWORD ───────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return 200 to prevent email enumeration attacks
    if (!user) {
      res.status(200).json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Auth App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Password Reset Request</h2>
          <p>You requested a password reset for your account.</p>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #64748b; font-size: 14px;">If you did not request this, you can safely ignore this email.</p>
          <p style="color: #64748b; font-size: 12px;">Or copy this link: ${resetUrl}</p>
        </div>
      `,
    });

    res.status(200).json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err: any) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to send reset email. Please try again." });
  }
};

// ─── 5. RESET PASSWORD ────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Password reset link is invalid or has expired." });
      return;
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully. You can now log in." });
  } catch (err: any) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "An unexpected error occurred. Please try again." });
  }
};
