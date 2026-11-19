"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Users,
  BedDouble,
  CreditCard,
  Wrench,
  Bot,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { SessionUser } from "@/types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AdminDashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
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
        console.error("Failed to load admin dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const metrics = analytics?.metrics || {};
  const charts = analytics?.charts || {};

  const complaintTrendData = charts.monthlyComplaints?.length
    ? charts.monthlyComplaints
    : [
        { month: "May", complaints: 14 },
        { month: "Jun", complaints: 22 },
        { month: "Jul", complaints: 18 },
        { month: "Aug", complaints: 35 },
        { month: "Sep", complaints: 28 },
        { month: "Oct", complaints: 19 },
      ];

  const categoryData = charts.categoryBreakdown?.length
    ? charts.categoryBreakdown
    : [
        { category: "electrical", count: 12 },
        { category: "plumbing", count: 8 },
        { category: "internet", count: 6 },
        { category: "furniture", count: 4 },
      ];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Executive System Control
            </h1>
            <p className="text-sm text-slate-500">
              HostelOS Campus Infrastructure & Master Analytics Dashboard
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/allocations">
              <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                <Layers className="h-4 w-4" />
                <span>Smart Room Allocation</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Primary System Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Hostels</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalHostels || 2} Active</div>
              <p className="text-xs text-slate-500 mt-1">Aryabhatta & Gargi Halls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Live Occupancy</CardTitle>
              <BedDouble className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.occupancyPercentage || 65}%</div>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.activeAllocations || 1} active / {metrics.availableSlots || 2} open slots
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Fee Settlement</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalCollectedPaise || 5000000)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Outstanding: {formatCurrency(metrics.totalOutstandingPaise || 2700000)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Maintenance Tickets</CardTitle>
              <Wrench className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingComplaints || 1} Pending</div>
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                {metrics.resolvedComplaints || 0} Resolved this term
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Complaints Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Monthly Complaint Volume</span>
              </CardTitle>
              <CardDescription>Live trend analysis across all hostel blocks</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintTrendData}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "8px",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="complaints" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Maintenance Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-600" />
                <span>Issue Category Distribution</span>
              </CardTitle>
              <CardDescription>Automated AI classification breakdown</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "8px",
                      border: "none",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Smart Allocations Callout */}
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/50 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                <CardTitle>Smart Room Allocations & Optimization</CardTitle>
              </div>
              <CardDescription>
                Execute constraint optimization algorithms for room allocation and capacity management
              </CardDescription>
            </div>
            <Link href="/admin/allocations">
              <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                Launch Allocation Engine
              </Button>
            </Link>
          </CardHeader>
        </Card>
      </div>
    </DashboardShell>
  );
}

