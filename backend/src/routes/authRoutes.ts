import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/authController";
import { protect } from "../middleware/auth";
import {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middleware/validate";

const router = Router();

// Rate limiter: max 10 auth attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts from this IP. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password reset: max 5 per hour
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many password reset requests. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", authLimiter, validateSignup, signup);
router.post("/login", authLimiter, validateLogin, login);
router.post("/forgot-password", resetLimiter, validateForgotPassword, forgotPassword);
router.post("/reset-password/:token", resetLimiter, validateResetPassword, resetPassword);
router.get("/me", protect, getMe);

export default router;
