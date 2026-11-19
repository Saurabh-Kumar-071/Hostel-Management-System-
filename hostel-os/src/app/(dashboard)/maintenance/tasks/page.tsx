"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle2 } from "lucide-react";
import type { SessionUser } from "@/types";

export default function MaintenanceTasksPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
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
          setTasks(c.data || []);
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
            <span>Assigned Maintenance Work Orders</span>
          </h1>
          <p className="text-sm text-slate-500">
            Active repair tickets assigned directly to your department and technician ID
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Technician Queue ({tasks.length})</CardTitle>
            <CardDescription>Zero student financial/personal data exposed</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No active work orders in your queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((task) => (
                  <div key={task._id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">{task.ticketId}</span>
                        <Badge variant="outline">{task.category}</Badge>
                        <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"}>
                          {task.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge variant="secondary">{task.status.toUpperCase()}</Badge>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{task.title}</h4>
                    <p className="text-xs text-slate-500">{task.description}</p>
                    <p className="text-xs text-slate-400">Location: Room {task.roomId?.roomNumber || "101"}</p>
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

