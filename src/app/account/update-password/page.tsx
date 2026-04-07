"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      if (!session) {
        setMessage("No active session. Use the link in your password-reset email, or sign in from the login page.");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (password.length < 8) {
      setStatus("error");
      setMessage("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("saving");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Set a new password</h1>
      <p className="mt-2 text-slate-600">After saving, you&apos;ll be signed in and taken to your dashboard.</p>

      {hasSession === false ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          {message}
          <Link href="/login" className="mt-2 block font-medium text-blue-700 hover:underline">
            Go to sign in
          </Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="font-medium text-slate-800">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="mt-2 w-full rounded-md border border-slate-300 p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status === "saving"}
            />
          </label>
          <label className="block">
            <span className="font-medium text-slate-800">Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="mt-2 w-full rounded-md border border-slate-300 p-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={status === "saving"}
            />
          </label>
          <button
            type="submit"
            disabled={status === "saving" || hasSession !== true}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {status === "saving" ? "Saving…" : "Update password"}
          </button>
        </form>
      )}

      {message && hasSession !== false ? (
        <p
          className={`mt-4 rounded-lg border p-3 text-sm ${
            status === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        >
          {message}
        </p>
      ) : null}

      <p className="mt-8 text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-blue-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
