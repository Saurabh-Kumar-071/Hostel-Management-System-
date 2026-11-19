"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BedDouble,
  LogOut,
  FileText,
  Wrench,
  Utensils,
  CreditCard,
  Bot,
  Users,
  Building,
  Bell,
  Layers,
  ClipboardList,
  Sparkles,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const NAV_CONFIG: Record<Role, NavItem[]> = {
  student: [
    { title: "Dashboard", href: "/student", icon: LayoutDashboard },
    { title: "My Room", href: "/student/room", icon: BedDouble },
    { title: "Leaves & Gate Passes", href: "/student/leaves", icon: FileText },
    { title: "Complaints & Repairs", href: "/student/complaints", icon: Wrench },
    { title: "Mess & Dining", href: "/student/mess", icon: Utensils },
    { title: "Fee & Invoices", href: "/student/fees", icon: CreditCard },
  ],
  warden: [
    { title: "Overview", href: "/warden", icon: LayoutDashboard },
    { title: "Student Roster", href: "/warden/students", icon: Users },
    { title: "Leave Approvals", href: "/warden/leaves", icon: FileCheck },
    { title: "Hostel Maintenance", href: "/warden/complaints", icon: Wrench },
    { title: "Visitor Log", href: "/warden/visitors", icon: ClipboardList },
    { title: "Hostel Notices", href: "/warden/notices", icon: Bell },
  ],
  admin: [
    { title: "Master Analytics", href: "/admin", icon: LayoutDashboard },
    { title: "Hostels & Blocks", href: "/admin/hostels", icon: Building },
    { title: "Room Management", href: "/admin/rooms", icon: BedDouble },
    { title: "Smart Allocation", href: "/admin/allocations", icon: Layers },
    { title: "Staff Directory", href: "/admin/staff", icon: Users },
    { title: "Finance & Dues", href: "/admin/finance", icon: CreditCard },
  ],
  maintenance: [
    { title: "Work Orders", href: "/maintenance", icon: LayoutDashboard },
    { title: "Assigned Repairs", href: "/maintenance/tasks", icon: Wrench },
    { title: "Resolution History", href: "/maintenance/history", icon: ClipboardList },
  ],
  accountant: [
    { title: "Financial Overview", href: "/accountant", icon: LayoutDashboard },
    { title: "Fee Structures", href: "/accountant/fee-structures", icon: Layers },
    { title: "Invoices & Dues", href: "/accountant/invoices", icon: CreditCard },
    { title: "Payment Verifications", href: "/accountant/payments", icon: FileCheck },
  ],
};

interface SidebarProps {
  role: Role;
  isOpen?: boolean;
}

export function Sidebar({ role, isOpen = true }: SidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_CONFIG[role] || [];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 top-16 z-30 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-200 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        <nav className="flex flex-1 flex-col space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === `/${role}`
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                  )}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
          <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
          <div className="text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200">HostelOS v1.0</div>
            <div className="text-slate-500">Academic SaaS Edition</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

