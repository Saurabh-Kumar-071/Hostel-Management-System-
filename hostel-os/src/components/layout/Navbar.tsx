"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, ShieldCheck, Sparkles, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SessionUser } from "@/types";

interface NavbarProps {
  user: SessionUser;
  onToggleSidebar?: () => void;
}

export function Navbar({ user, onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // Suppress background poll errors
      }
    }
    fetchNotifications();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const roleColorMap: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700 border-purple-200",
    warden: "bg-blue-100 text-blue-700 border-blue-200",
    student: "bg-emerald-100 text-emerald-700 border-emerald-200",
    maintenance: "bg-amber-100 text-amber-700 border-amber-200",
    accountant: "bg-cyan-100 text-cyan-700 border-cyan-200",
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8 dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-600"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hostel<span className="text-blue-600">OS</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Pill */}
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${roleColorMap[user.role] || "bg-slate-100"}`}
        >
          {user.role}
        </span>

        {/* AI Assistant Quick Pill */}
        <Link href={`/${user.role === "admin" ? "admin" : "student"}/ai-assistant`}>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex items-center gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
            <span className="text-xs font-medium">AI Assistant</span>
          </Button>
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {user.name}
            </span>
            <span className="text-xs text-slate-500 truncate max-w-[140px]">
              {user.email}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign out"
            className="text-slate-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

