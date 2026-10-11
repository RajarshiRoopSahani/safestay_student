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

  function SignupForm() {
    const { user, loading: authLoading, register } = useAuth();
    const router = useRouter();
    const next = safeRedirect(useSearchParams().get("next"));

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<"STUDENT" | "OWNER">("STUDENT");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      if (!authLoading && user) router.replace(next);
    }, [authLoading, user, next, router]);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);

      if (password.length < 8) return setError("Password must be at least 8 characters.");
      if (password !== confirm) return setError("Passwords do not match.");

      setSubmitting(true);
      try {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        });
        router.replace(next);
      } catch (err) {
        setError(getErrorMessage(err));
        setSubmitting(false);
      }
    }

    return (
      <div className="mx-auto flex max-w-md flex-col px-4 py-14">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-indigo-600" />
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Your name and email are never shown on reviews or photos.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
            <input id="name" required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">Phone (optional)</label>
            <input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
            <input id="confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </div>
          <div>
  <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">
    Account type
  </label>

  <select
    id="role"
    value={role}
    onChange={(e) => setRole(e.target.value as "STUDENT" | "OWNER")}
    className={inputClass}
  >
    <option value="STUDENT">Student</option>
    <option value="OWNER">Property Owner</option>
  </select>

  <p className="mt-1 text-xs text-slate-500">
    Choose Property Owner if you manage student accommodation.
  </p>
</div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Sign up
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  export default function SignupPage() {
    return (
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    );
  }
