"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, BedDouble } from "lucide-react";
import type { SessionUser } from "@/types";

export default function WardenStudentsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, aRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/allocations"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (aRes.ok) {
          const a = await aRes.json();
          setAllocations(a.data || []);
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

  const filtered = allocations.filter((a) => {
    const name = a.studentId?.userId?.name || "";
    const enr = a.studentId?.enrollmentNumber || "";
    const room = a.roomId?.roomNumber || "";
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || enr.toLowerCase().includes(q) || room.includes(q);
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span>Hostel Resident Directory</span>
            </h1>
            <p className="text-sm text-slate-500">
              Active verified occupants in your assigned hostel block
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search name, room, roll no..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resident Roster ({filtered.length} Students)</CardTitle>
            <CardDescription>Real-time room tenancy and emergency contacts</CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No residents matched your query.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => (
                  <div key={item._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.studentId?.userId?.name || "Student"}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          ({item.studentId?.enrollmentNumber || "ENR-001"})
                        </span>
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                          Room {item.roomId?.roomNumber || "101"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {item.studentId?.department || "Computer Science"} • Term: {item.academicYear} (Sem {item.semester})
                      </p>
                      <p className="text-xs text-slate-400">
                        Email: {item.studentId?.userId?.email} • Phone: {item.studentId?.userId?.phone || "N/A"}
                      </p>
                    </div>

                    <div className="text-xs text-slate-500 text-left md:text-right">
                      <div>Allocated on: {new Date(item.allocationDate).toLocaleDateString()}</div>
                      <div className="text-emerald-600 font-semibold mt-0.5">Status: Active Resident</div>
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

