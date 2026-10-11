"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api";
import { safeRedirect } from "@/utils/redirect";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function LoginForm() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const next = safeRedirect(useSearchParams().get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
  if (!authLoading && user) {
    if (user.role === "OWNER") {
      router.replace("/owner");
    } else if (user.role === "ADMIN") {
      router.replace("/admin");
    } else {
      router.replace(next);
    }
  }
}, [authLoading, user, next, router]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
  const loggedInUser = await login(email.trim(), password);

  if (loggedInUser.role === "OWNER") {
    router.replace("/owner");
  } else if (loggedInUser.role === "ADMIN") {
    router.replace("/admin");
  } else {
    router.replace(next);
  }
} catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="mb-6 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-indigo-600" />
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to save favorites, request bookings and use SafeStay AI.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
          <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Log in
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="font-medium text-indigo-600 hover:underline">
          Forgot your password?
        </Link>
      </p>

      <p className="mt-5 text-center text-sm text-slate-600">
        New here?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
