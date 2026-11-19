"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default function AccountantDashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccountantData() {
      try {
        const [meRes, analyticsRes, invRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/analytics"),
          fetch("/api/finance/invoices"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.data.user);
        }
        if (analyticsRes.ok) {
          const aData = await analyticsRes.json();
          setAnalytics(aData.data);
        }
        if (invRes.ok) {
          const iData = await invRes.json();
          setInvoices(iData.data || []);
        }
      } catch (err) {
        console.error("Failed to load accountant dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadAccountantData();
  }, []);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const metrics = analytics?.metrics || {};

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hostel Bursar & Financial Ledger
          </h1>
          <p className="text-sm text-slate-500">
            Fee billing structures, student receivables, and receipt audits
          </p>
        </div>

        {/* 3 Financial Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Billed</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(metrics.totalBilledPaise || 7700000)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across all issued semester invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(metrics.totalCollectedPaise || 5000000)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Settled payments in bank ledger</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">Outstanding Dues</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(metrics.totalDuesPaise || 2700000)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Pending student balances</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Ledger Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Student Invoices</CardTitle>
            <CardDescription>Track payment status and line item breakdowns</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No invoices found in current term.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <div key={inv._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {inv.invoiceNumber}
                        </span>
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
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {formatCurrency(inv.balancePaise)}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Due Date</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {new Date(inv.dueDate).toLocaleDateString()}
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

