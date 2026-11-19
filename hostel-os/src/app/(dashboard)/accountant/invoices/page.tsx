"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default function AccountantInvoicesPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, iRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/finance/invoices"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (iRes.ok) {
          const i = await iRes.json();
          setInvoices(i.data || []);
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
            <CreditCard className="h-6 w-6 text-blue-600" />
            <span>Master Invoices & Dues Register</span>
          </h1>
          <p className="text-sm text-slate-500">
            Audit individual student billing records and payment progress
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoices Journal ({invoices.length} Bills)</CardTitle>
            <CardDescription>Generated against approved fee schedules</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No invoices found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <div key={inv._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">{inv.invoiceNumber}</span>
                        <Badge
                          variant={
                            inv.status === "paid"
                              ? "success"
                              : inv.status === "partially_paid"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {inv.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {inv.studentId?.userId?.name || "Student"} • {inv.academicYear} (Sem {inv.semester})
                      </p>
                      <p className="text-xs text-slate-400">
                        Total: {formatCurrency(inv.totalPaise)} | Paid: {formatCurrency(inv.paidPaise)} | Remaining Balance:{" "}
                        <span className="font-bold text-amber-600">{formatCurrency(inv.balancePaise)}</span>
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-400">
                      <div>Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
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

