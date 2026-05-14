"use client";

import { useRouter } from "next/navigation";
import AuthForm from "./authForm";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ToastType } from "@/hooks/useToast";

interface LoginViewProps {
  onNavigateToSignup: () => void;
  addToast: (message: string, type?: ToastType) => void;
}

export function LoginView({ onNavigateToSignup, addToast }: LoginViewProps) {
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (email: string, password?: string) => {
    if (!password) {
      // Forgot password flow
      try {
        const res = await authApi.forgotPassword(email);
        addToast(res.message, "success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to send reset email.";
        addToast(message, "error");
      }
      return;
    }

    try {
      const res = await authApi.login(email, password);
      login(res.token, res.user);
      addToast(`Welcome back, ${res.user.name || res.user.email}!`, "success");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      addToast(message, "error");
    }
  };

  return (
    <AuthForm
      title="Sign In"
      buttonText="Sign In"
      toggleText="Don't have an account? Sign Up"
      onToggle={onNavigateToSignup}
      onSubmit={handleSubmit}
      showForgotPasswordLink={true}
      showNameField={false}
    />
  );
}
