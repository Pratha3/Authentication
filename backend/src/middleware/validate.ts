import { Request, Response, NextFunction } from "express";

const emailRegex = /^\S+@\S+\.\S+$/;

export const validateSignup = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password, name } = req.body;

  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ message: "Please provide a valid email address." });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters long." });
    return;
  }

  if (name && name.trim().length < 2) {
    res.status(400).json({ message: "Name must be at least 2 characters long." });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ message: "Please provide a valid email address." });
    return;
  }

  if (!password) {
    res.status(400).json({ message: "Password is required." });
    return;
  }

  next();
};

export const validateForgotPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;

  if (!email || !emailRegex.test(email)) {
    res.status(400).json({ message: "Please provide a valid email address." });
    return;
  }

  next();
};

export const validateResetPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters long." });
    return;
  }

  next();
};
