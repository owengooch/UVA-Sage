"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { parseStoredProfile } from "@/lib/student-profile";

function hasUsedSiteLocally(): boolean {
  const raw = localStorage.getItem("uvaProfile");
  if (!raw) return false;
  try {
    const p = parseStoredProfile(raw);
    if (p.onboardingCompleted === true) return true;
    return Boolean(p.major?.trim() && p.graduationYear?.trim());
  } catch {
    return false;
  }
}

type HomeMode = "loading" | "signedin" | "returning" | "new";

const btnPrimary =
  "inline-flex rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800";
const btnSecondary =
  "inline-flex rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50";

export function HomeCtaButtons() {
  const [mode, setMode] = useState<HomeMode>("loading");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const apply = () => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setMode("signedin");
          return;
        }
        setMode(hasUsedSiteLocally() ? "returning" : "new");
      });
    };
    apply();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => apply());
    return () => subscription.unsubscribe();
  }, []);

  if (mode === "signedin") {
    return (
      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className={btnPrimary}>
            Go to Dashboard
          </Link>
          <Link href="/onboarding" className={btnSecondary}>
            Update your profile
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          You&apos;re signed in — your email appears in the header. Use the dashboard for your personalized plan.
        </p>
      </div>
    );
  }

  if (mode === "returning") {
    return (
      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className={btnPrimary}>
            Sign In With UVA Email
          </Link>
          <Link href="/dashboard" className={btnSecondary}>
            Go to Dashboard
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          Already filled out your questionnaire? Sign in with the same email — we&apos;ll load your saved profile. Use
          “Go to Dashboard” only if you want this browser&apos;s local copy without signing in.
        </p>
      </div>
    );
  }

  /* loading (treat like new) + new */
  return (
    <div className="mt-8 space-y-3">
      <div className="flex flex-wrap gap-3">
        <Link href="/onboarding" className={btnPrimary}>
          Start Your Page
        </Link>
        <Link href="/login" className={btnSecondary}>
          Sign In With UVA Email
        </Link>
      </div>
      <p className="text-sm text-slate-600">
        New here? Start Your Page walks you through setup. Returning on a new device? Use Sign In With UVA Email.
      </p>
    </div>
  );
}
