"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowLeft } from "lucide-react";

export default function PredictiveAnalyticsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="max-w-md w-full text-center border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <TrendingUp className="h-7 w-7 text-slate-400" />
          </div>
          <CardTitle className="text-xl">AI Prediction Disabled</CardTitle>
          <CardDescription className="text-sm mt-2">
            The external AI predictive microservice has been removed. Master analytics and real-time maintenance reports remain fully operational under Admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin">
            <Button className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" /> Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
