"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const QUICK_LOGIN_EMAIL_KEY = "uvaQuickLoginEmail";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const existing = localStorage.getItem(QUICK_LOGIN_EMAIL_KEY);
    if (existing) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [router]);

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      setMessage("Enter an email address.");
      return;
    }
    localStorage.setItem(QUICK_LOGIN_EMAIL_KEY, trimmed.toLowerCase());
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Quick Login</h1>
      <p className="mt-2 text-slate-600">
        Enter any email to continue. This bypasses password and email verification for testing.
      </p>

      <form onSubmit={handleQuickLogin} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="font-medium text-slate-800">Email</span>
          <input
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded-md border border-slate-300 p-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit" className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800">
          Continue
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 rounded-lg border p-3 text-sm ${status === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-slate-50 text-slate-800"}`}
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
  return <LoginForm />;
}
