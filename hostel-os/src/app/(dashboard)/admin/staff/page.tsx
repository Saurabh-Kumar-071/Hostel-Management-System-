"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Shield } from "lucide-react";
import type { SessionUser } from "@/types";

export default function AdminStaffPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
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

  const staffDirectory = [
    {
      name: "Dr. Vikram Seth",
      role: "admin",
      department: "Office of the Dean & Provost",
      designation: "Chief Administrator",
      email: "admin@hostelos.edu",
      phone: "+91 98110 01100",
    },
    {
      name: "Prof. Rajesh Sharma",
      role: "warden",
      department: "Student Affairs",
      designation: "Chief Warden (Aryabhatta Hall)",
      email: "warden@hostelos.edu",
      phone: "+91 98110 01101",
    },
    {
      name: "Suresh Kumar",
      role: "maintenance",
      department: "Electrical Maintenance",
      designation: "Lead Field Electrician",
      email: "maintenance@hostelos.edu",
      phone: "+91 98110 01102",
    },
    {
      name: "Ananya Deshmukh",
      role: "accountant",
      department: "Finance & Accounts",
      designation: "Senior Hostel Bursar",
      email: "accountant@hostelos.edu",
      phone: "+91 98110 01103",
    },
  ];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Hostel Administration & Staff Directory</span>
          </h1>
          <p className="text-sm text-slate-500">
            Provisioned institutional personnel with server-side verified Role-Based Access Control
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {staffDirectory.map((staff, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{staff.name}</CardTitle>
                  <CardDescription>{staff.designation}</CardDescription>
                </div>
                <Badge variant="secondary" className="uppercase font-mono text-[10px]">
                  {staff.role}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-500">
                <div>Department: <strong className="text-slate-800 dark:text-slate-200">{staff.department}</strong></div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{staff.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{staff.phone}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

