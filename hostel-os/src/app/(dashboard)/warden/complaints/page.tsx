"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle2, Clock, AlertTriangle, Sparkles } from "lucide-react";
import type { SessionUser } from "@/types";

export default function WardenComplaintsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, cRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/complaints"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (cRes.ok) {
          const c = await cRes.json();
          setComplaints(c.data || []);
        }
      } catch (err) {
        console.error(err);
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

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-600" />
            <span>Hostel Maintenance Oversight</span>
          </h1>
          <p className="text-sm text-slate-500">
            Monitor open repair tickets, AI severity classifications, and staff assignments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reported Tickets Queue ({complaints.length})</CardTitle>
            <CardDescription>Track status transitions across electrical, plumbing, and network issues</CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No maintenance complaints reported.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {complaints.map((ticket) => (
                  <div key={ticket._id} className="py-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
                      <Badge
                        variant={
                          ticket.status === "resolved"
                            ? "success"
                            : ticket.status === "in_progress"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {ticket.status.toUpperCase()}
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {ticket.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {ticket.description}
                    </p>

                    {ticket.aiClassification && (
                      <div className="rounded-lg bg-blue-50/70 p-2 text-[11px] text-blue-800 border border-blue-100 flex items-center justify-between dark:bg-slate-900 dark:text-blue-300 dark:border-slate-800">
                        <span>
                          🤖 <strong>AI Diagnosis:</strong> Routed to {ticket.aiClassification.department}
                        </span>
                        {ticket.aiClassification.isUrgent && (
                          <span className="font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                            Critical Hazard
                          </span>
                        )}
                      </div>
                    )}
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

