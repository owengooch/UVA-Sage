"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { isAllowedUvaEmail, uvaEmailHint } from "@/lib/auth/uva-email";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type AuthMode = "magic" | "password";

function formatAuthError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return `${raw} Wait a while before requesting another email, or use email & password if you already have an account.`;
  }
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [magicStatus, setMagicStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [pwdStatus, setPwdStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState<string | null>(urlError);

  const showError = magicStatus === "error" || pwdStatus === "error" || !!urlError;
  const showSuccess = magicStatus === "sent" && message && !showError;

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setMessage(null);
    setMagicStatus("idle");
    setPwdStatus("idle");
  };

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trimmed = email.trim();
    if (!isAllowedUvaEmail(trimmed)) {
      setMagicStatus("error");
      setMessage(`That address is not allowed. ${uvaEmailHint()}`);
      return;
    }

    setMagicStatus("sending");
    const supabase = createBrowserSupabaseClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`
      }
    });

    if (error) {
      setMagicStatus("error");
      setMessage(formatAuthError(error.message));
      return;
    }

    setMagicStatus("sent");
    setMessage("Check your inbox for a sign-in link from Supabase. You can close this tab.");
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trimmed = email.trim();
    if (!isAllowedUvaEmail(trimmed)) {
      setPwdStatus("error");
      setMessage(`That address is not allowed. ${uvaEmailHint()}`);
      return;
    }
    if (!password) {
      setPwdStatus("error");
      setMessage("Enter your password.");
      return;
    }

    setPwdStatus("working");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password
    });

    if (error) {
      setPwdStatus("error");
      setMessage(formatAuthError(error.message));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleSignUp = async () => {
    setMessage(null);
    const trimmed = email.trim();
    if (!isAllowedUvaEmail(trimmed)) {
      setPwdStatus("error");
      setMessage(`That address is not allowed. ${uvaEmailHint()}`);
      return;
    }
    if (password.length < 8) {
      setPwdStatus("error");
      setMessage("Choose a password with at least 8 characters.");
      return;
    }

    setPwdStatus("working");
    const supabase = createBrowserSupabaseClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signUp({
      email: trimmed,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`
      }
    });

    if (error) {
      setPwdStatus("error");
      setMessage(formatAuthError(error.message));
      return;
    }

    setPwdStatus("idle");
    setMessage(
      "Account created. If email confirmation is on in your Supabase project, check your inbox to verify, then sign in."
    );
  };

  const handleForgotPassword = async () => {
    setMessage(null);
    const trimmed = email.trim();
    if (!isAllowedUvaEmail(trimmed)) {
      setPwdStatus("error");
      setMessage(`Enter your UVA email above first. ${uvaEmailHint()}`);
      return;
    }

    setPwdStatus("working");
    const supabase = createBrowserSupabaseClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${origin}/auth/callback?next=/account/update-password`
    });

    if (error) {
      setPwdStatus("error");
      setMessage(formatAuthError(error.message));
      return;
    }

    setPwdStatus("idle");
    setMessage("If an account exists for that email, you’ll get a reset link shortly.");
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Sign In</h1>
      <p className="mt-2 text-slate-600">
        {uvaEmailHint()} You can use a one-time email link or an email and password.
      </p>

      <div className="mt-6 flex rounded-lg border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => switchMode("magic")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === "magic" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Email link
        </button>
        <button
          type="button"
          onClick={() => switchMode("password")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === "password" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Email &amp; password
        </button>
      </div>

      {mode === "magic" ? (
        <form onSubmit={handleMagicSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="font-medium text-slate-800">UVA Email</span>
            <input
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-slate-300 p-2"
              placeholder="you@virginia.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={magicStatus === "sending" || magicStatus === "sent"}
            />
          </label>
          <button
            type="submit"
            disabled={magicStatus === "sending" || magicStatus === "sent"}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {magicStatus === "sending" ? "Sending link…" : magicStatus === "sent" ? "Link sent" : "Email Me a Sign-In Link"}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSignIn} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="font-medium text-slate-800">UVA Email</span>
            <input
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-slate-300 p-2"
              placeholder="you@virginia.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pwdStatus === "working"}
            />
          </label>
          <label className="block">
            <span className="font-medium text-slate-800">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              minLength={8}
              className="mt-2 w-full rounded-md border border-slate-300 p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pwdStatus === "working"}
            />
          </label>
          <button
            type="submit"
            disabled={pwdStatus === "working"}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {pwdStatus === "working" ? "Signing in…" : "Sign in"}
          </button>
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={pwdStatus === "working"}
              className="text-sm font-medium text-blue-700 hover:underline disabled:opacity-60"
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={pwdStatus === "working"}
              className="text-sm font-medium text-slate-700 hover:underline disabled:opacity-60"
            >
              Create account
            </button>
          </div>
        </form>
      )}

      {message && (
        <p
          className={`mt-4 rounded-lg border p-3 text-sm ${
            showError ? "border-red-200 bg-red-50 text-red-900" : showSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-800"
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
    <Suspense fallback={<main className="mx-auto max-w-md px-6 py-12">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
