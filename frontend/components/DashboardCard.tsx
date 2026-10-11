import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = { label: string; value: number; icon: LucideIcon; href?: string; alert?: boolean };

export default function DashboardCard({ label, value, icon: Icon, href, alert = false }: Props) {
  const highlight = alert && value > 0;

  const body = (
    <div className="flex items-center gap-4">
      <span className={`rounded-xl p-3 ${highlight ? "bg-amber-100 text-amber-700" : "bg-indigo-50 text-indigo-600"}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value.toLocaleString("en-IN")}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );

  const base = `rounded-2xl border bg-white p-5 shadow-sm ${highlight ? "border-amber-300" : "border-slate-200"}`;

  return href ? (
    <Link href={href} className={`${base} block transition hover:-translate-y-0.5 hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}
