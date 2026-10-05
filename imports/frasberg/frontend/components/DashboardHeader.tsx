"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function DashboardHeader() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  async function logout() {
    await fetch("/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="w-full border-b border-neutral-800 p-4 flex items-center justify-between bg-black">
      <div className="flex items-center gap-8">
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
        <nav className="flex gap-4">
          <a href="/dashboard/projects" className="hover:underline text-neutral-300">Projects</a>
          <a href="/dashboard/projects/new" className="hover:underline text-neutral-300">New Project</a>
          <a href="/dashboard/remix/123" className="hover:underline text-neutral-300">Remix</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-neutral-400 text-sm">
            {user.email}
          </span>
        )}
        <button
          onClick={logout}
          className="px-3 py-1 bg-red-600 rounded text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
