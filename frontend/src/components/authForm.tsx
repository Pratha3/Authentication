"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Password strength ────────────────────────────────────────────────────────
function getPasswordStrength(pw: string) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Weak",   color: "bg-red-500",     text: "text-red-500"     },
    { label: "Fair",   color: "bg-amber-500",   text: "text-amber-500"   },
    { label: "Good",   color: "bg-yellow-500",  text: "text-yellow-600"  },
    { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
  ];
  return { score, ...(levels[score - 1] ?? levels[0]) };
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
  const [showPw, setShowPw] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const strength = showNameField && !isForgot ? getPasswordStrength(password) : null;

  const validate = () => {
    const e: typeof errors = {};
    if (showNameField && !isForgot && name.trim().length < 2)
      e.name = "Name must be at least 2 characters.";
    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      e.email = "Please enter a valid email address.";
    if (!isForgot && password.length < 6)
      e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      if (isForgot) await onSubmit(email);
      else if (showNameField) await onSubmit(email, password, name.trim() || undefined);
      else await onSubmit(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    setIsForgot(false);
    setErrors({});
    setEmail(""); setPassword(""); setName("");
    onToggle();
  };

  const displayTitle = isForgot ? "Forgot Password" : title;
  const displayDesc = isForgot
    ? "Enter your email and we'll send you a reset link."
    : showNameField
    ? "Create your account to get started."
    : "Welcome back! Sign in to continue.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 mb-1">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AuthApp</h1>
          <p className="text-sm text-muted-foreground">Secure · Fast · Reliable</p>
        </div>

        <Card className="shadow-xl border-0 ring-1 ring-border/60">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">{displayTitle}</CardTitle>
            <CardDescription className="text-center">{displayDesc}</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">

              {/* Name field */}
              {showNameField && !isForgot && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }}
                      error={errors.name}
                      className="pl-9"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                    error={errors.email}
                    className="pl-9"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              {!isForgot && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {showForgotPasswordLink && (
                      <button
                        type="button"
                        onClick={() => { setIsForgot(true); setErrors({}); }}
                        className="text-xs text-primary hover:underline underline-offset-4 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                      error={errors.password}
                      className="pl-9 pr-10"
                      autoComplete={showNameField ? "new-password" : "current-password"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {strength && password.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1" aria-label={`Password strength: ${strength.label}`}>
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-all duration-300",
                              i <= strength.score ? strength.color : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strength: <span className={cn("font-semibold", strength.text)}>{strength.label}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                {isForgot ? "Send Reset Link" : buttonText}
              </Button>

              <div className="relative w-full">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={isForgot ? () => setIsForgot(false) : handleToggle}
              >
                {isForgot ? "← Back to Sign In" : toggleText}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">Terms</span>
          {" "}and{" "}
          <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
