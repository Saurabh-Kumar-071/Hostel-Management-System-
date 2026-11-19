"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, UserCheck, Clock } from "lucide-react";
import type { SessionUser } from "@/types";

export default function WardenVisitorsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, vRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/visitors"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (vRes.ok) {
          const v = await vRes.json();
          setVisitors(v.data || []);
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
            <span>Campus Visitor & Guest Log</span>
          </h1>
          <p className="text-sm text-slate-500">
            Security ingress and egress logs for resident guardians and external guests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Security Visitor Records</CardTitle>
            <CardDescription>Verified by Main Gate and Hostel Warden</CardDescription>
          </CardHeader>
          <CardContent>
            {visitors.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No active visitor records found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visitors.map((v) => (
                  <div key={v._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {v.visitorName}
                        </span>
                        <Badge variant="outline">Relation: {v.relation}</Badge>
                        <Badge variant="secondary">{v.status.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Visiting Resident: <strong>{v.studentId?.userId?.name || "Student"}</strong> • Purpose: "{v.purpose}"
                      </p>
                      <p className="text-xs text-slate-400">
                        Contact: {v.phone} • ID Proof: {v.idProofType} ({v.idProofNumber})
                      </p>
                    </div>

                    <div className="text-xs text-slate-500">
                      <div>Expected: {new Date(v.expectedCheckIn).toLocaleDateString()}</div>
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

