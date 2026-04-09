"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  normalizeUsername,
  usernameToAuthEmail,
  validateUsername
} from "@/lib/sage-username-auth";

const btnPrimary =
  "motion-press-primary inline-flex justify-center rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white shadow-md shadow-blue-900/15 hover:bg-blue-800 disabled:pointer-events-none disabled:opacity-60";
const btnSecondary =
  "motion-press-outline inline-flex justify-center rounded-lg border border-slate-300/90 bg-white/90 px-5 py-3 font-semibold text-slate-800 shadow-sm hover:border-sky-300 hover:bg-white disabled:pointer-events-none disabled:opacity-60";

type HomeMode = "loading" | "signedin" | "anon";

export function HomeCtaButtons() {
  const router = useRouter();
  const [mode, setMode] = useState<HomeMode>("loading");

  const [suUser, setSuUser] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suErr, setSuErr] = useState<string | null>(null);
  const [suPending, setSuPending] = useState(false);

  const [siUser, setSiUser] = useState("");
  const [siPass, setSiPass] = useState("");
  const [siErr, setSiErr] = useState<string | null>(null);
  const [siPending, setSiPending] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const apply = () => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        setMode(session?.user ? "signedin" : "anon");
      });
    };
    apply();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => apply());
    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuErr(null);
    const v = validateUsername(suUser);
    if (v) {
      setSuErr(v);
      return;
    }
    if (suPass.length < 6) {
      setSuErr("Password must be at least 6 characters.");
      return;
    }
    if (suPass !== suConfirm) {
      setSuErr("Passwords do not match.");
      return;
    }
    setSuPending(true);
    const supabase = createBrowserSupabaseClient();
    const name = normalizeUsername(suUser);
    const { data, error } = await supabase.auth.signUp({
      email: usernameToAuthEmail(name),
      password: suPass,
      options: { data: { username: name } }
    });
    setSuPending(false);
    if (error) {
      setSuErr(error.message);
      return;
    }
    if (!data.session) {
      setSuErr(
        "Your account was created. If your email needs confirmation, use the link in your inbox, then sign in below. If you already confirmed or email confirmation is off for your account, try signing in now—you’ll enter your UVA email on the profile page next."
      );
      return;
    }
    router.push("/onboarding");
    router.refresh();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiErr(null);
    const v = validateUsername(siUser);
    if (v) {
      setSiErr(v);
      return;
    }
    setSiPending(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToAuthEmail(normalizeUsername(siUser)),
      password: siPass
    });
    setSiPending(false);
    if (error) {
      setSiErr("That username and password don’t match our records.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  if (mode === "signedin") {
    return (
      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className={btnPrimary}>
            Go to dashboard
          </Link>
          <Link href="/onboarding" className={btnSecondary}>
            Update your profile
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          You&apos;re signed in — your username appears in the header. Open the dashboard for your personalized plan.
        </p>
      </div>
    );
  }

  if (mode === "loading") {
    return <p className="mt-8 text-sm text-slate-500">Loading…</p>;
  }

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">New here</h2>
        <p className="mt-1 text-sm text-slate-600">Create a username and password, then we&apos;ll take you through the questionnaire.</p>
        <form onSubmit={(e) => void handleSignUp(e)} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Username</span>
            <input
              autoComplete="username"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
              value={suUser}
              onChange={(e) => setSuUser(e.target.value)}
              placeholder="your_username"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
              value={suPass}
              onChange={(e) => setSuPass(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
              value={suConfirm}
              onChange={(e) => setSuConfirm(e.target.value)}
            />
          </label>
          {suErr ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{suErr}</p> : null}
          <button type="submit" disabled={suPending} className={`${btnPrimary} w-full`}>
            {suPending ? "Creating account…" : "Create account & start"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Already have an account</h2>
        <p className="mt-1 text-sm text-slate-600">Sign in with the same username and password to open your dashboard.</p>
        <form onSubmit={(e) => void handleSignIn(e)} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Username</span>
            <input
              autoComplete="username"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
              value={siUser}
              onChange={(e) => setSiUser(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
              value={siPass}
              onChange={(e) => setSiPass(e.target.value)}
            />
          </label>
          {siErr ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{siErr}</p> : null}
          <button type="submit" disabled={siPending} className={`${btnPrimary} w-full`}>
            {siPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-blue-700 hover:underline">
            Sign in on a full page
          </Link>
        </p>
      </div>
    </div>
  );
}
