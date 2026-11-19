"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  QrCode,
  Clock,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Download,
  ExternalLink,
  Sparkles,
  Info,
  Calendar,
  MapPin,
  AlertCircle
} from "lucide-react";
import type { SessionUser } from "@/types";

interface PermanentQRData {
  studentDetails: {
    name: string;
    enrollmentNumber: string;
    department: string;
    hostelName: string;
    roomNumber: string;
    curfewTime: string;
    emergencyContact: string;
    academicYear: string;
  };
  securitySignature: string;
  qrCode: string;
  qrPayload: string;
}

export default function StudentLeavesPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [permanentPass, setPermanentPass] = useState<PermanentQRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPass, setSelectedPass] = useState<any | null>(null);
  const [showPermanentModal, setShowPermanentModal] = useState(false);

  // Form State
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState<"regular" | "emergency" | "medical" | "vacation">("regular");
  const [departureDateTime, setDepartureDateTime] = useState("");
  const [expectedReturnDateTime, setExpectedReturnDateTime] = useState("");
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Set default times for evening outpass (e.g. today 5:00 PM to 9:30 PM)
  useEffect(() => {
    const now = new Date();
    const depart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 30);
    const returnTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 30);
    
    // Format YYYY-MM-DDTHH:mm
    const toLocalISO = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setDepartureDateTime(toLocalISO(depart));
    setExpectedReturnDateTime(toLocalISO(returnTime));
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, lRes, qrRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/leaves"),
          fetch("/api/students/permanent-qr"),
        ]);

        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (lRes.ok) {
          const l = await lRes.json();
          setLeaves(l.data || []);
        }
        if (qrRes.ok) {
          const q = await qrRes.json();
          if (q.success) {
            setPermanentPass(q.data);
          }
        }
      } catch (err) {
        console.error("Failed to load leave data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType,
          destination,
          reason,
          departureDateTime: new Date(departureDateTime).toISOString(),
          expectedReturnDateTime: new Date(expectedReturnDateTime).toISOString(),
          isEmergency: leaveType === "emergency",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit leave");
      }

      setFormSuccess(
        leaveType === "regular"
          ? "⚡ Routine evening outpass instantly approved! Your gate pass has been registered."
          : "Leave request registered successfully."
      );
      setLeaves((prev) => [data.data, ...prev]);
      setDestination("");
      setReason("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Submission error");
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span>Digital Outpass & Permanent Identity QR</span>
          </h1>
          <p className="text-sm text-slate-500">
            Secure, instant student gate passes with cryptographic roll number verification and automated evening outpass clearance.
          </p>
        </div>

        {/* Permanent Digital Outpass Banner Card */}
        {permanentPass && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-xl border border-slate-700">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            
            <div className="grid gap-6 md:grid-cols-3 items-center">
              {/* Left / Info */}
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-400/40 text-emerald-300 bg-emerald-500/10 text-xs py-1 px-2.5">
                    <Sparkles className="h-3 w-3 mr-1" /> PERMANENT RESIDENT PASS
                  </Badge>
                  <Badge variant="outline" className="border-blue-400/40 text-blue-300 bg-blue-500/10 text-xs py-1 px-2.5">
                    Curfew: 10:00 PM Sharp
                  </Badge>
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{permanentPass.studentDetails.name}</h2>
                  <p className="text-sm text-slate-300 font-mono mt-0.5">
                    Roll No: <span className="font-semibold text-white">{permanentPass.studentDetails.enrollmentNumber}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-300 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block">Hostel & Room</span>
                    <span className="font-medium text-white">{permanentPass.studentDetails.hostelName} • Room {permanentPass.studentDetails.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Department</span>
                    <span className="font-medium text-white">{permanentPass.studentDetails.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Security Hash</span>
                    <span className="font-mono text-emerald-400 font-bold tracking-wider">{permanentPass.securitySignature}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gate Verification</span>
                    <span className="font-medium text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Instant Guard Scan
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs gap-1.5 shadow-md"
                    onClick={() => setShowPermanentModal(true)}
                  >
                    <QrCode className="h-3.5 w-3.5" /> Show Fullscreen QR to Guard
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-200 hover:bg-slate-800 text-xs gap-1.5"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = permanentPass.qrCode;
                      a.download = `${permanentPass.studentDetails.enrollmentNumber}-HostelPass.png`;
                      a.click();
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> Download Pass
                  </Button>
                </div>
              </div>

              {/* Right / QR Code Display */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-lg border border-slate-200 text-slate-900 max-w-[220px] mx-auto md:mx-0 md:ml-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={permanentPass.qrCode}
                  alt="Student Permanent QR"
                  className="w-36 h-36 object-contain"
                />
                <div className="mt-2 text-center">
                  <span className="text-[10px] font-mono font-bold text-slate-600 tracking-wider block">
                    {permanentPass.studentDetails.enrollmentNumber}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Cryptographically Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Apply Form */}
          <Card className="lg:col-span-1 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Log Outpass / Departure</span>
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                  ⚡ Auto-Approved
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Routine evening outings (market, dinner, coaching) are instantly verified with your permanent QR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formSuccess && (
                <div className="mb-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}
              {formError && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleApplyLeave} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Outpass Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-2xs dark:border-slate-800 dark:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    value={leaveType}
                    onChange={(e: any) => setLeaveType(e.target.value)}
                  >
                    <option value="regular">Regular Evening Outpass (Auto-Approved)</option>
                    <option value="emergency">Emergency Outing</option>
                    <option value="medical">Medical Outing</option>
                    <option value="vacation">Semester Break / Vacation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Destination</label>
                  <Input
                    placeholder="e.g. Local Market, Library, Coaching, City"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Departure Time</label>
                  <Input
                    type="datetime-local"
                    value={departureDateTime}
                    onChange={(e) => setDepartureDateTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">
                    Expected Return <span className="text-red-500 font-normal">(Curfew: 10:00 PM)</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={expectedReturnDateTime}
                    onChange={(e) => setExpectedReturnDateTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Reason / Purpose</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Buying dinner, groceries, stationery..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-2xs dark:border-slate-800 dark:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/30 p-2.5 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2 border border-blue-100 dark:border-blue-900/50">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    No waiting for warden signatures! Routine leaves are immediately registered with your permanent Roll Number pass.
                  </span>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering Outpass...
                    </>
                  ) : (
                    "Register & Generate Outpass"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Leaves History Table */}
          <Card className="lg:col-span-2 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Recent Outpasses & Clearance History</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  {leaves.length} records found
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time record of your departures, gate passes, and curfew timestamps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  You have not applied for any leave yet. Submit an outpass to generate your departure ticket.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaves.map((item) => (
                    <div key={item._id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-blue-500" />
                            {item.destination}
                          </span>
                          <Badge
                            variant={
                              item.status === "approved"
                                ? "success"
                                : item.status === "rejected"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-[10px]"
                          >
                            {item.status === "approved" ? "APPROVED / ACTIVE" : item.status.toUpperCase()}
                          </Badge>
                          {item.leaveType === "regular" && (
                            <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200">
                              Evening Outpass
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 italic">"{item.reason}"</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Out: {new Date(item.departureDateTime).toLocaleDateString()} {new Date(item.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span>
                            Return by: {new Date(item.expectedReturnDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {item.gatePassId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs shrink-0"
                          onClick={() => setSelectedPass(item.gatePassId)}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>View Outpass Ticket</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs shrink-0"
                          onClick={() => setShowPermanentModal(true)}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Use Permanent Pass</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal: View Single Outpass Gate Pass Ticket */}
        {selectedPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <Card className="max-w-sm w-full bg-white dark:bg-slate-900 text-center shadow-2xl border border-slate-200">
              <CardHeader className="pb-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Digital Outpass Gate Pass</CardTitle>
                <CardDescription className="text-xs">
                  Automated Clearance • Validated with Permanent Student Identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-white rounded-xl inline-block border border-slate-200 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedPass.qrCode} alt="Gate Pass QR" className="w-48 h-48 mx-auto" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-mono space-y-1">
                  <div>Ticket #: <span className="font-bold text-slate-900 dark:text-white">{selectedPass.passNumber}</span></div>
                  <div>Student Roll No: <span className="font-semibold text-blue-600">ENR-2024-8842</span></div>
                  <div className="text-[11px] text-slate-400">Curfew: Return before 10:00 PM</div>
                </div>
                <p className="text-xs text-slate-500">
                  Scan at security gate turnstile upon exiting and entering campus premises.
                </p>
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white" onClick={() => setSelectedPass(null)}>
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: View Fullscreen Permanent Resident QR Pass */}
        {showPermanentModal && permanentPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-slate-900 dark:text-white text-sm">HostelOS Gate Security Turnstile</span>
                </div>
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px]">
                  VERIFIED ACTIVE
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{permanentPass.studentDetails.name}</h3>
                <p className="text-xs font-mono text-slate-500">
                  Roll No: <span className="text-slate-900 dark:text-white font-bold">{permanentPass.studentDetails.enrollmentNumber}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {permanentPass.studentDetails.hostelName} • Room {permanentPass.studentDetails.roomNumber}
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl inline-block border-2 border-slate-900 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={permanentPass.qrCode} alt="Fullscreen QR" className="w-56 h-56 mx-auto" />
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-left space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Campus Curfew:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">10:00 PM Sharp</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">HMAC-SHA256 Token:</span>
                  <span className="font-mono font-bold text-emerald-600">{permanentPass.securitySignature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{permanentPass.studentDetails.department}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = permanentPass.qrCode;
                    a.download = `${permanentPass.studentDetails.enrollmentNumber}-HostelPass.png`;
                    a.click();
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> Save QR Code
                </Button>
                <Button className="flex-1 text-xs bg-slate-900 hover:bg-slate-800 text-white" onClick={() => setShowPermanentModal(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
