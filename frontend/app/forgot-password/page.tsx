"use client";

import Link from "next/link";
import { useState } from "react";
import { Info, KeyRound, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/services/api";
import { requestPasswordReset } from "@/services/authService";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      setMessage(await requestPasswordReset(email.trim()));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="mb-6 text-center">
        <KeyRound className="mx-auto h-10 w-10 text-indigo-600" />
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Forgot your password?</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the email you signed up with.</p>
      </div>

      <p className="mb-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Password reset by email is not available in this version of SafeStay Student, so no email will be sent. Please
          contact the SafeStay team to have your password reset.
        </span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
        <div>
          <label htmlFor="fp-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="fp-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Send reset instructions
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
