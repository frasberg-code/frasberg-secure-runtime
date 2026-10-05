"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error) {
      router.push("/dashboard");
    } else {
      alert(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm bg-neutral-900 p-6 rounded-lg border border-neutral-800"
      >
        <h1 className="text-xl font-semibold mb-4">Create Account</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-neutral-800 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded bg-neutral-800 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-emerald-600 py-2 rounded-md"
        >
          Sign Up
        </button>

        <p className="text-neutral-500 text-sm mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-emerald-400">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
