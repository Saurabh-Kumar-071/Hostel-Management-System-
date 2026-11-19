"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Users,
  MapPin,
  Sparkles,
  AlertTriangle,
  QrCode
} from "lucide-react";
import type { SessionUser } from "@/types";

export default function WardenLeavesPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "evening" | "pending">("all");

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, lRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/leaves"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (lRes.ok) {
          const l = await lRes.json();
          setLeaves(l.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/leaves/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setLeaves((prev) =>
          prev.map((item) =>
            item._id === id
              ? { ...item, status: action === "approve" ? "approved" : "rejected" }
              : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const activeEveningOutpasses = leaves.filter((l) => l.leaveType === "regular" && l.status === "approved");
  const pendingRequests = leaves.filter((l) => l.status === "pending");

  const displayedLeaves = leaves.filter((item) => {
    if (filter === "evening") return item.leaveType === "regular";
    if (filter === "pending") return item.status === "pending";
    return true;
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span>Outpass Clearance & Live Curfew Roster</span>
          </h1>
          <p className="text-sm text-slate-500">
            Real-time campus movement monitoring. Routine evening outpasses are auto-cleared with student Roll No QR passes, avoiding approval bottlenecks.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-xs border-blue-100 bg-blue-50/40 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
                Active Evening Outpasses
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-900 dark:text-white flex items-center justify-between">
                <span>{activeEveningOutpasses.length}</span>
                <Users className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                Auto-authorized via permanent student QR
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-amber-100 bg-amber-50/40 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">
                Campus Curfew Rule
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-900 dark:text-white flex items-center justify-between">
                <span>10:00 PM</span>
                <Clock className="h-5 w-5 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Gate turnstile flags late returns automatically
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-purple-100 bg-purple-50/40 dark:bg-purple-950/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase text-purple-700 dark:text-purple-300">
                Special Leaves Requiring Review
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-900 dark:text-white flex items-center justify-between">
                <span>{pendingRequests.length}</span>
                <FileCheck className="h-5 w-5 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
                Overnight semester breaks / vacations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Outpasses List */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base">Resident Movement Roster</CardTitle>
                <CardDescription className="text-xs">
                  Showing real-time records with student roll numbers, destinations, and curfew timestamps
                </CardDescription>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs self-start">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    filter === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All ({leaves.length})
                </button>
                <button
                  onClick={() => setFilter("evening")}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    filter === "evening" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  ⚡ Evening Outpasses ({activeEveningOutpasses.length})
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    filter === "pending" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Awaiting Review ({pendingRequests.length})
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {displayedLeaves.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No outpass records matching the selected view.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedLeaves.map((leave) => (
                  <div key={leave._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {leave.studentId?.userId?.name || user.name || "Aarav Patel"}
                        </span>
                        <span className="font-mono text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          ENR-2024-8842
                        </span>
                        <Badge
                          variant={
                            leave.status === "approved"
                              ? "success"
                              : leave.status === "rejected"
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[10px]"
                        >
                          {leave.status === "approved" ? "APPROVED / CLEAR" : leave.status.toUpperCase()}
                        </Badge>
                        {leave.leaveType === "regular" && (
                          <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                            Auto-Pass
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        Destination: <strong className="text-slate-800 dark:text-slate-200">{leave.destination}</strong> • Purpose: "{leave.reason}"
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Departed: {new Date(leave.departureDateTime).toLocaleDateString()} {new Date(leave.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="text-amber-600 font-medium">Return Curfew: {new Date(leave.expectedReturnDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {leave.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                            onClick={() => handleAction(leave._id, "approve")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve Pass</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                            onClick={() => handleAction(leave._id, "reject")}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          <QrCode className="h-3.5 w-3.5" />
                          <span>QR Pass Active</span>
                        </div>
                      )}
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
