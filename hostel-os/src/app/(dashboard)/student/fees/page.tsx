"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreditCard, CheckCircle2, Clock, AlertCircle, FileCheck, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SessionUser } from "@/types";

export default function StudentFeesPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);
  const [paymentAmountRupees, setPaymentAmountRupees] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeeData() {
      try {
        const [meRes, invRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/finance/invoices"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (invRes.ok) {
          const i = await invRes.json();
          setInvoices(i.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFeeData();
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setPayError(null);
    setPaySuccess(null);
    setProcessing(true);

    try {
      const amountPaise = Math.round(parseFloat(paymentAmountRupees) * 100);
      const res = await fetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: activeInvoice._id,
          amountPaise,
          paymentMethod,
          notes: "Student self-service portal settlement",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed");
      }

      setPaySuccess("Payment processed successfully! Receipt reference: " + data.data.paymentReference);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Payment error");
    } finally {
      setProcessing(false);
    }
  };

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
            <span>Hostel & Mess Financial Ledger</span>
          </h1>
          <p className="text-sm text-slate-500">
            Decimal-safe integer accounting in Indian Rupees with itemized billing breakdowns
          </p>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>My Invoices & Payment Schedule</CardTitle>
            <CardDescription>Verified semester lodging, catering dues, and caution deposits</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No invoices found for your account.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <div key={inv._id} className="py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
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
                        <span className="text-xs text-slate-400">
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Line items */}
                      <div className="text-xs text-slate-500 space-y-0.5">
                        {inv.lineItems?.map((item: any, idx: number) => (
                          <div key={idx}>
                            • {item.description}: <strong>{formatCurrency(item.amountPaise)}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="text-sm">
                        Total Invoiced: <strong>{formatCurrency(inv.totalPaise)}</strong> | Paid:{" "}
                        <span className="text-emerald-600 font-semibold">{formatCurrency(inv.paidPaise)}</span> | Remaining:{" "}
                        <span className="text-amber-600 font-bold">{formatCurrency(inv.balancePaise)}</span>
                      </div>
                    </div>

                    {inv.status !== "paid" && (
                      <Button
                        onClick={() => {
                          setActiveInvoice(inv);
                          setPaymentAmountRupees((inv.balancePaise / 100).toString());
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Pay Dues Online</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Process Payment */}
        {activeInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <Card className="max-w-md w-full bg-white dark:bg-slate-900 shadow-xl">
              <CardHeader>
                <CardTitle>Settle Invoice Dues</CardTitle>
                <CardDescription>
                  Invoice: {activeInvoice.invoiceNumber} • Remaining: {formatCurrency(activeInvoice.balancePaise)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payError && (
                  <div className="mb-3 rounded-md bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                    {payError}
                  </div>
                )}
                {paySuccess && (
                  <div className="mb-3 rounded-md bg-emerald-50 p-2.5 text-xs text-emerald-700 border border-emerald-200">
                    {paySuccess}
                  </div>
                )}

                <form onSubmit={handlePay} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-slate-500">
                      Amount to Pay (INR)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentAmountRupees}
                      onChange={(e) => setPaymentAmountRupees(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-slate-500">
                      Payment Channel
                    </label>
                    <select
                      className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="upi">Instant UPI (GooglePay / PhonePe / Paytm)</option>
                      <option value="card">Debit / Credit Card</option>
                      <option value="bank_transfer">Net Banking / NEFT</option>
                      <option value="cash">Challan Cash Deposit</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1" disabled={processing}>
                      {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Settle"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveInvoice(null)}
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

