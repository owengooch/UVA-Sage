"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  normalizeUsername,
  usernameToAuthEmail,
  validateUsername
} from "@/lib/sage-username-auth";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => {
    const raw = searchParams.get("next");
    return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  }, [searchParams]);

  const callbackError = useMemo(() => {
    const raw = searchParams.get("error");
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [searchParams]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace(next);
        router.refresh();
      }
    });
  }, [router, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validateUsername(username);
    if (v) {
      setError(v);
      return;
    }
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: usernameToAuthEmail(normalizeUsername(username)),
      password
    });
    setPending(false);
    if (signErr) {
      setError("That username and password don’t match our records.");
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-2 text-slate-600">Use the username and password you created when you signed up.</p>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-6 space-y-4 rounded-xl border border-sky-200/70 bg-white/90 p-6 shadow-md shadow-sky-900/5 backdrop-blur-sm"
      >
        <label className="block">
          <span className="font-medium text-slate-800">Username</span>
          <input
            autoComplete="username"
            className="mt-2 w-full rounded-md border border-slate-300 p-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="font-medium text-slate-800">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            className="mt-2 w-full rounded-md border border-slate-300 p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {callbackError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{callbackError}</p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="motion-press-primary w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white shadow-md shadow-blue-900/20 hover:bg-blue-800 disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        <Link href="/" className="font-medium text-blue-700 hover:underline">
          Back to home
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-6 py-12">
          <p className="text-slate-600">Loading…</p>
        </main>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
