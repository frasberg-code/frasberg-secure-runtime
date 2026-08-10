"use client";

import Link from "next/link";
import { getSession } from "@/lib/session";
import { requireAuth } from "@/lib/redirect";
import DashboardHeader from "@/components/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  requireAuth(session);

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardHeader />
      <main className="p-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        color: "#ccc",
        textDecoration: "none",
        padding: "6px 0",
      }}
    >
      {children}
    </Link>
  );
}
