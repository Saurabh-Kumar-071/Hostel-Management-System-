"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Layers, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import type { SessionUser } from "@/types";

export default function SmartAllocationPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allocatingId, setAllocatingId] = useState<string | null>(null);
  const [successList, setSuccessList] = useState<string[]>([]);

  useEffect(() => {
    async function loadUser() {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.data.user);
      }
    }
    loadUser();
  }, []);

  const handleRunOptimizer = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/smart-allocation", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecommendations(data.data.recommendations || []);
      }
    } catch (err) {
      console.error("Allocation engine failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAllocation = async (rec: any) => {
    setAllocatingId(rec.studentId);
    try {
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: rec.studentId,
          roomId: rec.recommendedRoomId,
          academicYear: "2025-2026",
          semester: 1,
          remarks: "Allocated via HostelOS Smart Optimization Engine",
        }),
      });

      if (res.ok) {
        setSuccessList((prev) => [...prev, rec.studentId]);
      }
    } catch (err) {
      console.error("Failed to approve allocation", err);
    } finally {
      setAllocatingId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-blue-600" />
              <span>Smart Room Allocation Engine</span>
            </h1>
            <p className="text-sm text-slate-500">
              Constraint optimization matching unallocated students with verified room capacity
            </p>
          </div>
          <Button
            onClick={handleRunOptimizer}
            disabled={loading}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Run Allocation Optimizer</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
            <CardDescription>
              Human-in-the-loop: Administrator verifies and commits each suggested assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <Layers className="h-10 w-10 mx-auto text-slate-300" />
                <p className="text-sm">Click "Run Allocation Optimizer" to evaluate pending unallocated students.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recommendations.map((rec) => {
                  const isApproved = successList.includes(rec.studentId);
                  const isWorking = allocatingId === rec.studentId;

                  return (
                    <div
                      key={rec.studentId}
                      className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {rec.studentName}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            ({rec.enrollmentNumber})
                          </span>
                          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                            {rec.department}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Recommended:{" "}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Room {rec.roomNumber}
                          </span>{" "}
                          at {rec.hostelName}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          {rec.reasons?.map((r: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-1">
                              • {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        {isApproved ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Committed to DB</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isWorking}
                            onClick={() => handleApproveAllocation(rec)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            {isWorking ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            <span>Approve & Allocate</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

