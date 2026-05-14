"use client";

import { useRouter } from "next/navigation";
import AuthForm from "./authForm";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ToastType } from "@/hooks/useToast";

interface SignupViewProps {
  onNavigateToLogin: () => void;
  addToast: (message: string, type?: ToastType) => void;
}

export function SignupView({ onNavigateToLogin, addToast }: SignupViewProps) {
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (email: string, password?: string, name?: string) => {
    try {
      const res = await authApi.signup(email, password!, name);
      login(res.token, res.user);
      addToast("Account created successfully! Welcome aboard.", "success");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      addToast(message, "error");
    }
  };

  return (
    <AuthForm
      title="Create Account"
      buttonText="Create Account"
      toggleText="Already have an account? Sign In"
      onToggle={onNavigateToLogin}
      onSubmit={handleSubmit}
      showForgotPasswordLink={false}
      showNameField={true}
    />
  );
}
