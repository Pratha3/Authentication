"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginView } from "./loginView";
import { SignupView } from "./signupView";
import { useAuth } from "@/context/AuthContext";
import { useToastContext } from "@/context/ToastContext";

export function AuthPageClient() {
  const [screen, setScreen] = useState<"login" | "signup">("login");
  const { user, isLoading } = useAuth();
  const { addToast } = useToastContext();
  const router = useRouter();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  if (screen === "signup") {
    return (
      <SignupView
        onNavigateToLogin={() => setScreen("login")}
        addToast={addToast}
      />
    );
  }

  return (
    <LoginView
      onNavigateToSignup={() => setScreen("signup")}
      addToast={addToast}
    />
  );
}
