"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default function AccountantPaymentsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, pRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/finance/payments"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (pRes.ok) {
          const p = await pRes.json();
          setPayments(p.data || []);
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
            <FileCheck className="h-6 w-6 text-blue-600" />
            <span>Bank & Payment Reconciliation Ledger</span>
          </h1>
          <p className="text-sm text-slate-500">
            Verified settlement transactions, transaction references, and issued receipts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reconciliation Transactions</CardTitle>
            <CardDescription>Verified student fee deposits</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <div key={p._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {p.paymentReference}
                        </span>
                        <Badge variant="success">SETTLED</Badge>
                        <Badge variant="outline">{p.paymentMethod.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Student: {p.studentId?.userId?.name || "Student"} • Txn ID: {p.transactionId}
                      </p>
                      <p className="text-xs text-slate-400">
                        Date: {new Date(p.paymentDate).toLocaleDateString()} • Note: {p.notes || "Standard settlement"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-emerald-600">
                        +{formatCurrency(p.amountPaise)}
                      </span>
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

