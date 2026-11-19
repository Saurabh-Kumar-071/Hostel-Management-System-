import Link from "next/link";
import {
  ShieldCheck,
  Bot,
  Zap,
  Building,
  KeyRound,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">
            Hostel<span className="text-blue-600">OS</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-6 py-20 lg:py-28 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
            <Zap className="h-3.5 w-3.5 text-blue-600" />
            <span>Next-Gen AI Residential Management Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 dark:text-white">
            Intelligent Hostel Operations. <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Powered by Verified AI.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
            HostelOS connects Students, Wardens, Administrators, Maintenance Crews, and Accountants into a unified, secure, real-time operating ecosystem with dynamic allocations and AI assistance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-blue-500/25">
                <span>Enter Portal Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="gap-2">
                <KeyRound className="h-4 w-4 text-blue-600" />
                <span>Explore Role Demos</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="px-6 py-16 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Hostel AI Assistant & RAG</h3>
                <p className="text-sm text-slate-500">
                  Role-scoped intelligent agent retrieving live database records, fee statuses, dining menus, and handbook regulations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <FileCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Digital Outpass & QR Pass</h3>
                <p className="text-sm text-slate-500">
                  Warden review workflows with cryptographically signed digital gate passes and instant guard security QR verification.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                  <Building className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">Dynamic Room Allocations</h3>
                <p className="text-sm text-slate-500">
                  Capacity calculated strictly from live occupancy preventing double allocations and overbooking with constraint optimization.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950">
        <p>HostelOS – Complete AI-Powered Hostel Operating System. Built with Next.js 16, TypeScript & MongoDB Atlas.</p>
      </footer>
    </div>
  );
}
