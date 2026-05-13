import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

// 1. SIGNUP WITH PASSWORD HASHING
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Data received:", req.body);
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).send("Email already registered!");
      return;
    }

    // Securely hash password before saving (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).send("User registered successfully!");
  } catch (err: any) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).send("Error: " + err.message);
  }
};

// 2. LOGIN WITH PASSWORD VERIFICATION
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).send("Invalid email or password");
      return;
    }

    // Compare input plaintext password against encrypted database password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).send("Invalid email or password");
      return;
    }

    res.status(200).send("Login Successful!");
  } catch (err: any) {
    res.status(500).send("Server Error");
  }
};

// 3. FORGOT PASSWORD (FOR ANY USER EMAIL)
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).send("User with this email does not exist.");
      return;
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    
    // Hash token to protect against database leak exposures
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 Hour lifespan

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email, // Dynamic target routes to any user's valid inbox
      subject: "Password Reset Request",
      text: `You requested a password reset.\n\n Please click the link below to complete the process within 1 hour:\n\n ${resetUrl}\n\n If you did not request this, ignore this email.\n`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send("Password reset email sent successfully!");
  } catch (err: any) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).send("Server Error");
  }
};

// 4. RESET PASSWORD WITH RE-HASHING
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const tokenString = String(token);

    const hashedToken = crypto.createHash("sha256").update(tokenString).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).send("Password reset token is invalid or has expired.");
      return;
    }

    // Encrypt the brand new password securely
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.status(200).send("Password has been reset successfully!");
  } catch (err: any) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).send("Server Error");
  }
};

