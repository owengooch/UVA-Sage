"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  isLikelyUvaEmail,
  normalizeUvaEmail,
  UVA_QUICK_LOGIN_EMAIL_KEY
} from "@/lib/quick-login-email";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { parseStoredProfile } from "@/lib/student-profile";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => {
    const raw = searchParams.get("next");
    return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  }, [searchParams]);
  const fromOnboarding = searchParams.get("from") === "onboarding";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace("/dashboard");
        router.refresh();
      }
    });
  }, [router]);

  useEffect(() => {
    const quick = localStorage.getItem(UVA_QUICK_LOGIN_EMAIL_KEY);
    if (quick) {
      setEmail((v) => v || quick);
      return;
    }
    if (!fromOnboarding) return;
    const raw = localStorage.getItem("uvaProfile");
    if (!raw) return;
    try {
      const p = parseStoredProfile(raw);
      if (p.uvaEmail) setEmail((v) => v || p.uvaEmail!);
    } catch {
      /* ignore */
    }
  }, [fromOnboarding]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setStatus("idle");
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Enter your UVA email.");
      return;
    }
    if (!isLikelyUvaEmail(trimmed)) {
      setStatus("error");
      setMessage("Use your UVA email (ending in @virginia.edu).");
      return;
    }
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizeUvaEmail(trimmed),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });
    setPending(false);
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Check your email for a sign-in link. After you open it, you’ll land on your dashboard with your saved profile.");
  };

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trimmed = email.trim();
    if (!trimmed || !isLikelyUvaEmail(trimmed)) {
      setStatus("error");
      setMessage("Enter a valid UVA email to use this option.");
      return;
    }
    localStorage.setItem(UVA_QUICK_LOGIN_EMAIL_KEY, normalizeUvaEmail(trimmed));
    router.push(next);
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Sign in with UVA email</h1>
      <p className="mt-2 text-slate-600">
        We’ll email you a secure link. Same email brings you back to the profile stored in your account.
      </p>
      {fromOnboarding ? (
        <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm text-blue-950">
          You’ve finished your questionnaire in this browser. Use the <span className="font-semibold">same UVA email</span>{" "}
          you entered in onboarding so your answers sync to your account.
        </p>
      ) : null}

      <form onSubmit={(e) => void handleMagicLink(e)} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="font-medium text-slate-800">UVA email</span>
          <input
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded-md border border-slate-300 p-2"
            placeholder="you@virginia.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "Sending link…" : "Email me a sign-in link"}
        </button>
      </form>

      <form onSubmit={handleQuickLogin} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Continue in this browser only (no cloud save)
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 rounded-lg border p-3 text-sm ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-900"
              : status === "sent"
                ? "border-teal-200 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        >
          {message}
        </p>
      )}

      <p className="mt-8 text-center text-sm text-slate-600">
        <Link href="/" className="font-medium text-blue-700 hover:underline">
          Back to Home
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
