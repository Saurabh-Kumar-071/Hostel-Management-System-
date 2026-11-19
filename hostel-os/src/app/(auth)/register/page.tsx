"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("student");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role,
          enrollmentNumber: role === "student" ? enrollmentNumber : undefined,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // text wasn't valid JSON
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || text || `Registration failed with status ${res.status}`);
      }

      setSuccessMsg(data.message || "Registration successful! You may now sign in.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create an Account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Join the HostelOS resident and administration portal
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Resident Registration</CardTitle>
            <CardDescription>Enter details to create your secure institutional profile</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Full Name</label>
                <Input
                  type="text"
                  placeholder="Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Email Address</label>
                <Input
                  type="email"
                  placeholder="student@hostelos.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Role</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="student">Student</option>
                    <option value="warden">Warden</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Phone</label>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {role === "student" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Enrollment / Roll No</label>
                  <Input
                    type="text"
                    placeholder="ENR-2026-001"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Password</label>
                <Input
                  type="password"
                  placeholder="At least 8 chars with uppercase & number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

