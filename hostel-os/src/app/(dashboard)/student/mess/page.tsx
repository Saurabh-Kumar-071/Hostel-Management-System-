"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Utensils, Star, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import type { SessionUser } from "@/types";

export default function StudentMessPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [messData, setMessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    async function loadMess() {
      try {
        const [meRes, mRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/mess"),
        ]);
        if (meRes.ok) {
          const m = await meRes.json();
          setUser(m.data.user);
        }
        if (mRes.ok) {
          const md = await mRes.json();
          setMessData(md.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMess();
  }, []);

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/mess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, isAnonymous: false }),
      });
      if (res.ok) {
        setFeedbackSent(true);
        setComment("");
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

  const menu = messData?.menus?.[0]?.meals || {
    breakfast: { items: ["Masala Dosa", "Sambar", "Coconut Chutney", "Boiled Eggs", "Coffee/Tea"], timing: "7:30 AM - 9:00 AM" },
    lunch: { items: ["Paneer Butter Masala", "Dal Makhani", "Jeera Rice", "Butter Roti", "Gulab Jamun"], timing: "12:30 PM - 2:30 PM" },
    snacks: { items: ["Samosa with Mint Dip", "Masala Chai", "Biscuits"], timing: "5:00 PM - 6:00 PM" },
    dinner: { items: ["Special Chicken Dum Biryani / Veg Pulao", "Raita", "Salad", "Custard"], timing: "7:30 PM - 9:30 PM" },
  };

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Utensils className="h-6 w-6 text-blue-600" />
            <span>Dining & Mess Management</span>
          </h1>
          <p className="text-sm text-slate-500">
            Daily meal schedule, hygiene ratings, and student feedback portal
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Daily Menu Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Daily Meal Timetable</CardTitle>
              <CardDescription>Verified by Mess Committee & Chief Warden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4 space-y-1 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Breakfast</span>
                  <Badge variant="outline">{menu.breakfast.timing}</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {menu.breakfast.items.join(" • ")}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-1 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Lunch</span>
                  <Badge variant="outline">{menu.lunch.timing}</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {menu.lunch.items.join(" • ")}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-1 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Evening Snacks</span>
                  <Badge variant="outline">{menu.snacks.timing}</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {menu.snacks.items.join(" • ")}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-1 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Dinner</span>
                  <Badge variant="outline">{menu.dinner.timing}</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {menu.dinner.items.join(" • ")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>Mess Feedback</span>
              </CardTitle>
              <CardDescription>Rate quality and hygiene</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackSent ? (
                <div className="rounded-lg bg-emerald-50 p-4 text-center text-xs text-emerald-700 space-y-2 border border-emerald-200">
                  <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-600" />
                  <p className="font-semibold">Thank you! Your feedback has been recorded.</p>
                  <Button variant="outline" size="sm" onClick={() => setFeedbackSent(false)}>
                    Submit Another Rating
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleFeedback} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-500">Quality Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-6 w-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-slate-500">Comments</label>
                    <textarea
                      rows={4}
                      placeholder="Comment on taste, warmth, cleanliness, portion..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Review"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

