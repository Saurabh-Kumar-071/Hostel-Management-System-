import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HostelOS – AI-Powered Hostel Management System",
  description: "Enterprise SaaS platform for digitized hostel operations, smart room allocation, and conversational AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
