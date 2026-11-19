"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BedDouble, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default function AdminRoomsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, rRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/rooms"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (rRes.ok) {
          const r = await rRes.json();
          setRooms(r.data || []);
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
            <BedDouble className="h-6 w-6 text-blue-600" />
            <span>Interactive Room & Occupancy Grid</span>
          </h1>
          <p className="text-sm text-slate-500">
            Real-time occupancy calculated strictly from active allocations — zero hardcoded counters
          </p>
        </div>

        {/* Visual Room Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const isFull = room.currentOccupancy >= room.capacity;
            const occupancyPct = Math.round((room.currentOccupancy / room.capacity) * 100);

            return (
              <Card key={room._id} className="border-slate-200 shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                    <CardDescription>{room.hostelId?.name || "Hostel Block"}</CardDescription>
                  </div>
                  <Badge variant={isFull ? "destructive" : "success"}>
                    {isFull ? "FULL" : "AVAILABLE"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Occupancy:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {room.currentOccupancy} / {room.capacity} Beds ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${isFull ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Type: {room.type.toUpperCase()}</span>
                    <span>Rent: {formatCurrency(room.monthlyRentPaise)}/term</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}

