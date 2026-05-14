"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, Bell, ShieldCheck, Activity, Wifi,
  UserCircle2, Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToastContext } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { io, Socket } from "socket.io-client";
import { cn } from "@/lib/utils";

// ─── Stat card data ───────────────────────────────────────────────────────────
function getInitials(name?: string, email?: string): string {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export function DashboardClient() {
  const { user, logout, isLoading } = useAuth();
  const { addToast } = useToastContext();
  const router = useRouter();
  const [notifications, setNotifications] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) router.replace("/");
  }, [user, isLoading, router]);

  // Socket.io
  useEffect(() => {
    if (!user) return;
    const s = io("http://localhost:5000", { transports: ["websocket"] });
    setSocket(s);
    s.on("connect", () => {
      setIsConnected(true);
      s.emit("new_user_joined", user.email);
    });
    s.on("disconnect", () => setIsConnected(false));
    s.on("receive_notification", (msg: string) => {
      setNotifications((prev) => [msg, ...prev].slice(0, 10));
      addToast(msg, "info");
    });
    return () => { s.disconnect(); };
  }, [user, addToast]);

  const handleLogout = () => {
    socket?.disconnect();
    logout();
    addToast("You have been signed out.", "info");
    router.push("/");
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Account Status",
      value: "Active",
      icon: ShieldCheck,
      badgeVariant: "success" as const,
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Notifications",
      value: String(notifications.length),
      icon: Bell,
      badgeVariant: "default" as const,
      iconClass: "text-primary",
      bgClass: "bg-primary/5",
    },
    {
      label: "Live Session",
      value: isConnected ? "Connected" : "Offline",
      icon: Wifi,
      badgeVariant: isConnected ? ("success" as const) : ("secondary" as const),
      iconClass: isConnected ? "text-emerald-500" : "text-muted-foreground",
      bgClass: isConnected ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-muted",
    },
    {
      label: "Activity",
      value: "Normal",
      icon: Activity,
      badgeVariant: "secondary" as const,
      iconClass: "text-blue-500",
      bgClass: "bg-blue-50 dark:bg-blue-950/40",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">AuthApp</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notification badge */}
            {notifications.length > 0 && (
              <div className="relative">
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Button>
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {notifications.length}
                </span>
              </div>
            )}

            <Separator orientation="vertical" className="h-6" />

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none text-foreground">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">
                  {user.email}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 h-9">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Welcome hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-violet-600 p-6 sm:p-8 text-primary-foreground shadow-glow-primary">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 opacity-80" />
                <span className="text-sm font-medium opacity-80">Dashboard</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
              </h2>
              <p className="mt-1 text-sm opacity-75">{user.email}</p>
            </div>
            <Avatar className="h-14 w-14 border-2 border-white/30 shadow-lg shrink-0">
              <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn("p-2 rounded-lg", stat.bgClass)}>
                      <Icon className={cn("h-4 w-4", stat.iconClass)} />
                    </div>
                    <Badge variant={stat.badgeVariant} className="text-[10px] px-1.5 py-0">
                      {stat.value}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Notifications feed */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Live Notifications
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Real-time events from connected users
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                )} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  They&apos;ll appear here in real time when users connect.
                </p>
              </div>
            ) : (
              <ul className="space-y-2" aria-label="Notifications list">
                {notifications.map((msg, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bell className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground">{msg}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Account info card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-primary" />
              Account Details
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", value: user.name || "—" },
                { label: "Email Address", value: user.email },
                { label: "Account ID", value: `#${user.id.slice(-8).toUpperCase()}` },
                { label: "Status", value: "Active" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium text-foreground truncate">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
