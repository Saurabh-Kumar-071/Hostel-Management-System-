"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BedDouble,
  FileText,
  Wrench,
  Utensils,
  CreditCard,
  Bot,
  PlusCircle,
  Clock,
  Sparkles,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default function StudentDashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, analyticsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/analytics"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.data.user);
        }
        if (analyticsRes.ok) {
          const aData = await analyticsRes.json();
          setAnalytics(aData.data);
        }
      } catch (err) {
        console.error("Failed to load student dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const profile = analytics?.profile;
  const metrics = analytics?.metrics || {};
  const todayMenu = analytics?.todayMenu;

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-md">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.name}!</h1>
            <p className="text-blue-100 text-sm">
              Enrollment: {profile?.enrollmentNumber || "ENR-2024-8842"} • {profile?.course || "B.Tech"} (Semester {profile?.semester || 4})
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/student/leaves">
              <Button size="sm" variant="secondary" className="gap-1.5 font-semibold">
                <FileText className="h-4 w-4" />
                <span>Apply Outpass</span>
              </Button>
            </Link>
            <Link href="/student/complaints">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white gap-1.5">
                <Wrench className="h-4 w-4" />
                <span>New Complaint</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Top 4 Quick Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Allocated Room</CardTitle>
              <BedDouble className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.roomId?.roomNumber ? `Room ${profile.roomId.roomNumber}` : "Room 101"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {profile?.hostelId?.name || "Aryabhatta Hall of Residence"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Fee Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(metrics.totalBalancePaise || 2700000)}
              </div>
              <p className="text-xs text-amber-600 mt-1 font-medium">Due by 30 Nov 2026</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Active Leaves</CardTitle>
              <FileText className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeLeavesCount ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Pending or Approved outpasses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Open Tickets</CardTitle>
              <Wrench className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.complaintsCount ?? 1}</div>
              <p className="text-xs text-slate-500 mt-1">Maintenance requests in progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Dual Column Content: Today's Mess Menu & AI Assistant Prompt */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Dining Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-blue-600" />
                  <span>Today's Mess Schedule</span>
                </CardTitle>
                <CardDescription>Verified hostel daily catering menu</CardDescription>
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                Live Menu
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 space-y-1">
                <div className="text-xs font-bold uppercase text-slate-400">Breakfast (7:30 AM - 9:00 AM)</div>
                <div className="text-sm font-medium text-slate-800">
                  {todayMenu?.meals?.breakfast?.items?.join(", ") || "Masala Dosa, Sambar, Coconut Chutney, Tea/Coffee"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 space-y-1">
                <div className="text-xs font-bold uppercase text-slate-400">Lunch (12:30 PM - 2:30 PM)</div>
                <div className="text-sm font-medium text-slate-800">
                  {todayMenu?.meals?.lunch?.items?.join(", ") || "Paneer Butter Masala, Dal Makhani, Jeera Rice, Gulab Jamun"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 space-y-1">
                <div className="text-xs font-bold uppercase text-slate-400">Dinner (7:30 PM - 9:30 PM)</div>
                <div className="text-sm font-medium text-slate-800">
                  {todayMenu?.meals?.dinner?.items?.join(", ") || "Special Chicken Dum Biryani / Veg Pulao, Raita, Custard"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant Quick Interactive Widget */}
          <Card className="border-blue-200 bg-gradient-to-b from-blue-50/50 to-white dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                <CardTitle>Hostel AI Assistant</CardTitle>
              </div>
              <CardDescription>
                Ask about your room, dues, outpass guidelines, or curfew rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-2xs space-y-3">
                <div className="text-xs font-medium text-slate-500">Try asking:</div>
                <div className="space-y-1.5">
                  <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 font-medium">
                    "What is my allocated room number and floor?"
                  </div>
                  <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 font-medium">
                    "How much is my pending hostel fee?"
                  </div>
                  <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 font-medium">
                    "What is the status of my electrical complaint?"
                  </div>
                </div>
              </div>

              <Link href="/student/ai-assistant">
                <Button className="w-full gap-2 font-semibold">
                  <Bot className="h-4 w-4" />
                  <span>Open Conversational Assistant</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

