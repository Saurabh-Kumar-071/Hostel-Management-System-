"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, PlusCircle, Pin, Loader2 } from "lucide-react";
import type { SessionUser } from "@/types";

export default function WardenNoticesPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotices() {
      try {
        const [meRes, nRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/notices"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (nRes.ok) {
          const n = await nRes.json();
          setNotices(n.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadNotices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          type: "general",
          priority,
          targetAudience: "students",
          isPinned,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotices((prev) => [data.data, ...prev]);
        setTitle("");
        setContent("");
      }
    } catch (err) {
      console.error(err);
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
            <Bell className="h-6 w-6 text-blue-600" />
            <span>Hostel Notice Bulletin Board</span>
          </h1>
          <p className="text-sm text-slate-500">
            Publish official announcements, quiet hour directives, and campus advisories
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Create Notice Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Broadcast Announcement</CardTitle>
              <CardDescription>Instant notification to all residents</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Notice Title</label>
                  <Input
                    placeholder="e.g. Water tank cleaning schedule"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Priority</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Alert</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">Notice Content</label>
                  <textarea
                    rows={4}
                    placeholder="Detailed notice body..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinNotice"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="pinNotice" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    Pin notice to top of resident dashboard
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publish Notice"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Notices List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Active Notices</CardTitle>
              <CardDescription>Live bulletin board visible to all hostel residents</CardDescription>
            </CardHeader>
            <CardContent>
              {notices.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No notices published yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notices.map((n) => (
                    <div key={n._id} className="py-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {n.isPinned && (
                            <Badge variant="default" className="gap-1 bg-amber-500 text-white text-[10px]">
                              <Pin className="h-3 w-3" />
                              <span>PINNED</span>
                            </Badge>
                          )}
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {n.title}
                          </h4>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(n.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {n.content}
                      </p>
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

