"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import type { SessionUser } from "@/types";

export default function MaintenanceDashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMaintenanceData() {
      try {
        const [meRes, compRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/complaints"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.data.user);
        }
        if (compRes.ok) {
          const cData = await compRes.json();
          setComplaints(cData.data || []);
        }
      } catch (err) {
        console.error("Failed to load maintenance dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadMaintenanceData();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: "in_progress" | "resolved") => {
    try {
      const res = await fetch(`/api/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          resolutionDescription:
            newStatus === "resolved" ? "Repair successfully completed and verified." : undefined,
        }),
      });

      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const assignedTasks = complaints.filter((c) => c.status === "assigned");
  const inProgressTasks = complaints.filter((c) => c.status === "in_progress");
  const resolvedTasks = complaints.filter((c) => ["resolved", "closed"].includes(c.status));

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Maintenance Operations Board
          </h1>
          <p className="text-sm text-slate-500">
            Work order queue and issue remediation tracking
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Assigned Tasks</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{assignedTasks.length}</div>
              <p className="text-xs text-slate-500 mt-1">Awaiting initiation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">In Progress</CardTitle>
              <Wrench className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
              <p className="text-xs text-slate-500 mt-1">Currently being serviced</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{resolvedTasks.length}</div>
              <p className="text-xs text-slate-500 mt-1">Completed repairs</p>
            </CardContent>
          </Card>
        </div>

        {/* Work Order Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Work Order Queue</CardTitle>
            <CardDescription>Update status and record resolution verification</CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No maintenance tasks in your queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {complaints.map((ticket) => (
                  <div key={ticket._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {ticket.ticketId}
                        </span>
                        <Badge
                          variant={ticket.priority === "urgent" ? "destructive" : "secondary"}
                        >
                          {ticket.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{ticket.category}</Badge>
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {ticket.title}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {ticket.description}
                      </p>
                      <p className="text-xs text-slate-400">
                        Location: Room {ticket.roomId?.roomNumber || "101"} • Status: <span className="font-semibold uppercase">{ticket.status}</span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {ticket.status === "assigned" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(ticket._id, "in_progress")}
                        >
                          Start Work
                        </Button>
                      )}
                      {ticket.status === "in_progress" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleStatusUpdate(ticket._id, "resolved")}
                        >
                          Mark Resolved
                        </Button>
                      )}
                      {ticket.status === "resolved" && (
                        <Badge variant="success" className="px-3 py-1">
                          Completed
                        </Badge>
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

