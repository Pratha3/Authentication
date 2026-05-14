"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ToastContext } from "@/context/ToastContext";
import { ToastContainer } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";

function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, addToast, removeToast } = useToast();
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
