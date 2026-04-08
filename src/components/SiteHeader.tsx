"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { displayAccountLabel } from "@/lib/sage-username-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function SiteHeader() {
  const router = useRouter();
  const [label, setLabel] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const apply = (user: { email?: string | null; user_metadata?: { username?: string } | null } | null) => {
      if (!user) {
        setLabel(null);
        return;
      }
      setLabel(
        displayAccountLabel(user.email, (user.user_metadata as { username?: string } | null)?.username ?? null)
      );
    };
    supabase.auth.getUser().then(({ data: { user } }) => apply(user));
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
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
          {label === undefined ? (
            <span className="text-slate-400">…</span>
          ) : label ? (
            <>
              <span className="max-w-[14rem] truncate text-slate-500" title={label}>
                {label}
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
