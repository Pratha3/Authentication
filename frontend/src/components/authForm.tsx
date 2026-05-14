"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { cn } from "@/lib/utils";

// ─── Password strength ────────────────────────────────────────────────────────
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { score: 1, label: "Weak", color: "bg-red-500" },
    { score: 2, label: "Fair", color: "bg-amber-500" },
    { score: 3, label: "Good", color: "bg-yellow-400" },
    { score: 4, label: "Strong", color: "bg-emerald-500" },
  ];
  return levels[score - 1] ?? { score: 0, label: "", color: "" };
}

export interface AuthFormProps {
  title: string;
  buttonText: string;
  onSubmit: (email: string, password?: string, name?: string) => Promise<void>;
  toggleText: string;
  onToggle: () => void;
  showForgotPasswordLink?: boolean;
  showNameField?: boolean;
}

export default function AuthForm({
  title,
  buttonText,
  onSubmit,
  toggleText,
  onToggle,
  showForgotPasswordLink = false,
  showNameField = false,
}: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const isSignup = showNameField;
  const strength = isSignup ? getPasswordStrength(password) : null;

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (showNameField && !isForgotPasswordView && name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!isForgotPasswordView && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      if (isForgotPasswordView) {
        await onSubmit(email);
      } else if (showNameField) {
        await onSubmit(email, password, name.trim() || undefined);
      } else {
        await onSubmit(email, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsForgotPasswordView(false);
    setErrors({});
    setEmail("");
    setPassword("");
    setName("");
    onToggle();
  };

  const accentColor = isForgotPasswordView
    ? "border-t-amber-500"
    : isSignup
    ? "border-t-emerald-500"
    : "border-t-indigo-500";

  const buttonVariantClass = isForgotPasswordView
    ? "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500"
    : isSignup
    ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
    : "bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500";

  const displayTitle = isForgotPasswordView ? "Reset Password" : title;
  const displayDescription = isForgotPasswordView
    ? "Enter your email and we'll send you a reset link."
    : isSignup
    ? "Create your account to get started."
    : "Welcome back! Sign in to your account.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-3 shadow-lg">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">AuthApp</h1>
        </div>

        <Card className={cn("border-t-4 shadow-xl", accentColor)}>
          <CardHeader className="text-center">
            <CardTitle>{displayTitle}</CardTitle>
            <CardDescription>{displayDescription}</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {/* Name (signup only) */}
              {showNameField && !isForgotPasswordView && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                      }}
                      error={errors.name}
                      className="pl-9"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                    }}
                    error={errors.email}
                    className="pl-9"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              {!isForgotPasswordView && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {showForgotPasswordLink && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordView(true);
                          setErrors({});
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                      }}
                      error={errors.password}
                      className="pl-9 pr-10"
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>

                  {/* Password strength (signup only) */}
                  {isSignup && password.length > 0 && strength && (
                    <div className="space-y-1" aria-label={`Password strength: ${strength.label}`}>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-colors duration-300",
                              i <= strength.score ? strength.color : "bg-slate-200 dark:bg-slate-700"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Strength:{" "}
                        <span
                          className={cn(
                            "font-medium",
                            strength.score <= 1 ? "text-red-500"
                              : strength.score === 2 ? "text-amber-500"
                              : strength.score === 3 ? "text-yellow-500"
                              : "text-emerald-500"
                          )}
                        >
                          {strength.label}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className={cn("w-full text-white", buttonVariantClass)}
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isForgotPasswordView ? "Send Reset Link" : buttonText}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={isForgotPasswordView ? () => setIsForgotPasswordView(false) : handleToggleMode}
                className="w-full text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {isForgotPasswordView ? "← Back to Login" : toggleText}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
