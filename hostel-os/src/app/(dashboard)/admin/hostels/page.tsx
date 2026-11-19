"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, PlusCircle, Users } from "lucide-react";
import type { SessionUser } from "@/types";

export default function AdminHostelsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, hRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/hostels"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (hRes.ok) {
          const h = await hRes.json();
          setHostels(h.data || []);
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
            <Building className="h-6 w-6 text-blue-600" />
            <span>Hostel Campus Facilities</span>
          </h1>
          <p className="text-sm text-slate-500">
            Configure multi-building complexes, wings, and facility specifications
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {hostels.map((h) => (
            <Card key={h._id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{h.name}</CardTitle>
                  <CardDescription>Code: {h.code} • Gender Policy: {h.type.toUpperCase()}</CardDescription>
                </div>
                <Badge variant="success">Active Facility</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {h.description}
                </p>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Address: <strong>{h.address}</strong></div>
                  <div>Total Campus Capacity: <strong>{h.totalCapacity} Residents</strong></div>
                  <div>Emergency Contact: <strong>{h.contactPhone}</strong></div>
                </div>

                {h.facilities && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {h.facilities.map((f: string, i: number) => (
                      <span key={i} className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

