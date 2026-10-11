import Link from "next/link";
import { Inbox } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function EmptyState({ title, description, actionLabel, actionHref }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <Inbox className="h-10 w-10 text-slate-400" />
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
