"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import type { SessionUser } from "@/types";

export default function MaintenanceHistoryPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, compRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/complaints"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (compRes.ok) {
          const c = await compRes.json();
          const resolvedOnly = (c.data || []).filter((item: any) =>
            ["resolved", "closed"].includes(item.status)
          );
          setHistory(resolvedOnly);
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
            <ClipboardList className="h-6 w-6 text-blue-600" />
            <span>Resolution & Remediation History</span>
          </h1>
          <p className="text-sm text-slate-500">
            Archival log of resolved repair jobs and verified field work
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resolved Work Orders</CardTitle>
            <CardDescription>Verified maintenance completions</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No closed work orders yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((t) => (
                  <div key={t._id} className="py-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600">{t.ticketId}</span>
                      <Badge variant="success">RESOLVED</Badge>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t.title}</h4>
                    <p className="text-xs text-slate-500">{t.resolutionDescription || "Remediated and inspected."}</p>
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

