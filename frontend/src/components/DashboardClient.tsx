"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Bell, Shield, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToastContext } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { io, Socket } from "socket.io-client";

export function DashboardClient() {
  const { user, logout, isLoading } = useAuth();
  const { addToast } = useToastContext();
  const router = useRouter();
  const [notifications, setNotifications] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  // Socket.io connection
  useEffect(() => {
    if (!user) return;

    const s = io("http://localhost:5000", { transports: ["websocket"] });
    setSocket(s);

    s.on("connect", () => {
      s.emit("new_user_joined", user.email);
    });

    s.on("receive_notification", (msg: string) => {
      setNotifications((prev) => [msg, ...prev].slice(0, 10));
      addToast(msg, "info");
    });

    return () => {
      s.disconnect();
    };
  }, [user, addToast]);

  const handleLogout = () => {
    if (socket) socket.disconnect();
    logout();
    addToast("You have been signed out.", "info");
    router.push("/");
  };

  // Show spinner while checking auth
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" aria-label="Loading" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Account Status",
      value: "Active",
      icon: <Shield className="h-5 w-5 text-emerald-500" />,
      color: "text-emerald-600",
    },
    {
      label: "Notifications",
      value: String(notifications.length),
      icon: <Bell className="h-5 w-5 text-indigo-500" />,
      color: "text-indigo-600",
    },
    {
      label: "Session",
      value: "Live",
      icon: <Activity className="h-5 w-5 text-blue-500" />,
      color: "text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow">
              <Shield className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-50 text-lg">AuthApp</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              </div>
              <span>{user.name || user.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-1">
            Welcome back{user.name ? `, ${user.name}` : ""}! 👋
          </h2>
          <p className="text-indigo-100 text-sm">{user.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">{stat.icon}</div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live notifications */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              Live Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
                <p className="text-sm">No notifications yet. They&apos;ll appear here in real time.</p>
              </div>
            ) : (
              <ul className="space-y-2" aria-label="Notifications list">
                {notifications.map((msg, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg bg-indigo-50 dark:bg-indigo-950 px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <Bell className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" aria-hidden="true" />
                    {msg}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
