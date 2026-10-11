const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-200 text-slate-700",
  OPEN: "bg-amber-100 text-amber-800",
  IN_REVIEW: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INACTIVE: "bg-slate-200 text-slate-700",
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  OPEN: "Open",
  IN_REVIEW: "In review",
  RESOLVED: "Resolved",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
