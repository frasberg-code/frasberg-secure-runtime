"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";

export default function MagicLinkPage() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState("");

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (!error) {
      alert("Magic link sent!");
    } else {
      alert(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form
        onSubmit={sendMagicLink}
        className="w-full max-w-sm bg-neutral-900 p-6 rounded-lg border border-neutral-800"
      >
        <h1 className="text-xl font-semibold mb-4">Magic Link Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-neutral-800 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-emerald-600 py-2 rounded-md"
        >
          Send Link
        </button>
      </form>
    </div>
  );
}
