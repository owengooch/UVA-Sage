"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const QUICK_LOGIN_EMAIL_KEY = "uvaQuickLoginEmail";

export function SiteHeader() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const quick = localStorage.getItem(QUICK_LOGIN_EMAIL_KEY);
    if (quick) {
      setEmail(quick);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => setEmail(user?.email ?? null));
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(QUICK_LOGIN_EMAIL_KEY);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="font-display text-sm font-semibold tracking-tight text-slate-900 hover:text-blue-800">
          UVA Sage
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/onboarding" className="text-slate-600 hover:text-slate-900">
            Profile
          </Link>
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
            Dashboard
          </Link>
          {email === undefined ? (
            <span className="text-slate-400">…</span>
          ) : email ? (
            <>
              <span className="max-w-[14rem] truncate text-slate-500" title={email}>
                {email}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-md bg-blue-700 px-3 py-1.5 font-medium text-white hover:bg-blue-800">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
