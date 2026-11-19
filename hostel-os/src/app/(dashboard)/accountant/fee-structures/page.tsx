"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default function AccountantFeeStructuresPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, fRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/finance/fee-structures"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (fRes.ok) {
          const f = await fRes.json();
          setStructures(f.data || []);
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
            <Layers className="h-6 w-6 text-blue-600" />
            <span>Configured Fee Schedules & Rates</span>
          </h1>
          <p className="text-sm text-slate-500">
            Term billing schemas, lodging rates, mess caterer fees, and caution deposit rules
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {structures.map((s) => (
            <Card key={s._id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <CardDescription>Academic Term: {s.academicYear} (Semester {s.semester})</CardDescription>
                </div>
                <Badge variant="success">ACTIVE SCHEDULE</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 space-y-1 dark:bg-slate-800/50">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hostel Lodging Fee:</span>
                    <strong className="text-slate-900 dark:text-white">{formatCurrency(s.hostelFeePaise)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mess Dining Fee:</span>
                    <strong className="text-slate-900 dark:text-white">{formatCurrency(s.messFeePaise)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refundable Caution Deposit:</span>
                    <strong className="text-slate-900 dark:text-white">{formatCurrency(s.securityDepositPaise)}</strong>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Invoiced per Student:</span>
                  <span className="text-blue-600">{formatCurrency(s.totalFeePaise)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

