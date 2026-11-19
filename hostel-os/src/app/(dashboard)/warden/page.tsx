"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileCheck,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  Bell,
  Sparkles,
} from "lucide-react";
import type { SessionUser } from "@/types";

export default function WardenDashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWardenData() {
      try {
        const [meRes, analyticsRes, leavesRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/analytics"),
          fetch("/api/leaves?status=pending"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.data.user);
        }
        if (analyticsRes.ok) {
          const aData = await analyticsRes.json();
          setAnalytics(aData.data);
        }
        if (leavesRes.ok) {
          const lData = await leavesRes.json();
          setPendingLeaves(lData.data || []);
        }
      } catch (err) {
        console.error("Failed to load warden dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadWardenData();
  }, []);

  const handleLeaveAction = async (leaveId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/leaves/${leaveId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setPendingLeaves((prev) => prev.filter((l) => l._id !== leaveId));
      }
    } catch (err) {
      console.error("Failed to process leave action", err);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const metrics = analytics?.metrics || {};

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Warden Administration Hub
            </h1>
            <p className="text-sm text-slate-500">
              Assigned to: Aryabhatta Hall of Residence (North Campus)
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/warden/notices">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Bell className="h-4 w-4" />
                <span>Broadcast Notice</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Hostel Residents</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.studentsInHostel || 1}</div>
              <p className="text-xs text-slate-500 mt-1">Active verified occupants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Pending Leave Outpasses</CardTitle>
              <FileCheck className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {pendingLeaves.length || metrics.pendingLeaves || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Requires immediate review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Currently On Leave</CardTitle>
              <Clock className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeLeaves || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Checked out with valid Gate Pass</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Open Complaints</CardTitle>
              <Wrench className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.openComplaints || 1}</div>
              <p className="text-xs text-slate-500 mt-1">Requires staff dispatch</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel: Pending Leave Outpass Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <span>Pending Student Outpass Requests</span>
            </CardTitle>
            <CardDescription>
              Review departure reason, destination, and issue cryptographically signed QR gate passes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No leave requests pending your review at this time.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingLeaves.map((leave) => (
                  <div key={leave._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {leave.studentId?.userId?.name || "Student"}
                        </span>
                        <Badge variant="secondary">{leave.leaveType.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Destination: <span className="font-medium text-slate-900 dark:text-white">{leave.destination}</span> • Reason: "{leave.reason}"
                      </p>
                      <p className="text-xs text-slate-400">
                        Departure: {new Date(leave.departureDateTime).toLocaleDateString()} to Expected Return: {new Date(leave.expectedReturnDateTime).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        onClick={() => handleLeaveAction(leave._id, "approve")}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve & Issue QR</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => handleLeaveAction(leave._id, "reject")}
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

