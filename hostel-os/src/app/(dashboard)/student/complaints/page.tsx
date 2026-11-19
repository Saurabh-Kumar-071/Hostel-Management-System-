"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Wrench, PlusCircle, Sparkles, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import type { SessionUser } from "@/types";

export default function StudentComplaintsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("electrical");
  const [priority, setPriority] = useState("medium");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadComplaints() {
      try {
        const [meRes, cRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/complaints"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (cRes.ok) {
          const c = await cRes.json();
          setComplaints(c.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadComplaints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit complaint");
      }

      setSuccessMsg(data.message || "Complaint registered with AI classification");
      setComplaints((prev) => [data.data, ...prev]);
      setTitle("");
      setDescription("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error filing ticket");
    } finally {
      setSubmitting(false);
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
            <Wrench className="h-6 w-6 text-blue-600" />
            <span>Maintenance & Repairs Helpdesk</span>
          </h1>
          <p className="text-sm text-slate-500">
            Submit repair requests with automated AI urgency triage and department routing
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* File New Complaint Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Assisted Triage</span>
              </div>
              <CardTitle className="text-lg">Register Repair Ticket</CardTitle>
              <CardDescription>Emergency language automatically escalates priority</CardDescription>
            </CardHeader>
            <CardContent>
              {errorMsg && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                  {successMsg}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Category</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="electrical">Electrical (Fan, Lights, AC, Power)</option>
                    <option value="plumbing">Plumbing (Tap, Basin, Flush, Drain)</option>
                    <option value="internet">Internet / Wi-Fi / LAN</option>
                    <option value="cleaning">Housekeeping & Sanitation</option>
                    <option value="furniture">Furniture & Carpentry</option>
                    <option value="security">Security & Locks</option>
                    <option value="other">Other Facilities</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Summary / Title</label>
                  <Input
                    placeholder="e.g. Washroom tap leaking constantly"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Detailed Description</label>
                  <textarea
                    rows={4}
                    placeholder="Please describe the issue in detail (min 20 characters)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-blue-200" />
                  )}
                  <span>Submit with AI Triage</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Complaints Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Registered Tickets</CardTitle>
              <CardDescription>Track status transitions from Open to Resolved</CardDescription>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No complaints filed yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {complaints.map((c) => (
                    <div key={c._id} className="py-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600">{c.ticketId}</span>
                          <Badge
                            variant={
                              c.priority === "urgent"
                                ? "destructive"
                                : c.priority === "high"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {c.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{c.category}</Badge>
                        </div>
                        <Badge
                          variant={
                            c.status === "resolved"
                              ? "success"
                              : c.status === "in_progress"
                              ? "default"
                              : "secondary"
                          }
                          className="w-fit"
                        >
                          {c.status.toUpperCase()}
                        </Badge>
                      </div>

                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {c.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {c.description}
                      </p>

                      {c.aiClassification && (
                        <div className="rounded-lg bg-blue-50/60 p-2.5 text-[11px] text-blue-800 border border-blue-100 flex items-center justify-between dark:bg-slate-900 dark:text-blue-300 dark:border-slate-800">
                          <span>
                            🤖 <strong>AI Triage:</strong> Routed to {c.aiClassification.department} (Confidence:{" "}
                            {Math.round(c.aiClassification.confidence * 100)}%)
                          </span>
                          {c.aiClassification.isUrgent && (
                            <span className="font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                              Urgent Hazard Detected
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

