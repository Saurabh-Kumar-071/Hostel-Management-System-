"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BedDouble, Building, Users, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default function StudentRoomPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, aRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/analytics"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (aRes.ok) {
          const a = await aRes.json();
          setRoomData(a.data.profile);
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

  const room = roomData?.roomId || {
    roomNumber: "101",
    type: "double",
    capacity: 2,
    currentOccupancy: 1,
    monthlyRentPaise: 1200000,
    amenities: ["Air Conditioning", "High-speed LAN", "Attached Washroom", "Balcony", "Study Desk"],
  };

  const hostel = roomData?.hostelId || {
    name: "Aryabhatta Hall of Residence",
    type: "boys",
    address: "North Campus, Engineering Block A",
    contactPhone: "+91 98765 43210",
  };

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BedDouble className="h-6 w-6 text-blue-600" />
            <span>My Allocated Living Quarters</span>
          </h1>
          <p className="text-sm text-slate-500">
            Real-time tenancy status, roommate occupancy, and room specifications
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Room Card */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Room {room.roomNumber}</CardTitle>
                <CardDescription>{hostel.name} • {hostel.address}</CardDescription>
              </div>
              <Badge variant="success" className="px-3 py-1 text-xs">
                Active Tenancy
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Occupancy Indicator */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Room Occupancy</span>
                  <span className="font-bold text-blue-600">
                    {room.currentOccupancy} of {room.capacity} Beds Occupied
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${(room.currentOccupancy / room.capacity) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Configuration: {room.type.toUpperCase()} Occupancy • Rent: {formatCurrency(room.monthlyRentPaise)}/term
                </p>
              </div>

              {/* Room Amenities */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Verified In-Room Facilities
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {room.amenities.map((item: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-slate-200/80 p-2.5 text-xs font-medium text-slate-700 bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Hostel Rules & Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span>Hostel Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Curfew Time</div>
                <div>All residents must check in before 10:00 PM.</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Quiet Hours</div>
                <div>11:00 PM to 6:00 AM daily in corridor corridors.</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Emergency Warden Line</div>
                <div className="font-mono text-blue-600">{hostel.contactPhone}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

