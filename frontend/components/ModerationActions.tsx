"use client";

import { Check, Trash2, X } from "lucide-react";
import { ModerationStatus } from "@/types";

type Props = {
  status: ModerationStatus;
  busy: boolean;
  onStatus: (status: ModerationStatus) => void;
  onDelete: () => void;
};

export default function ModerationActions({ status, busy, onStatus, onDelete }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "APPROVED" && (
        <button
          disabled={busy}
          onClick={() => onStatus("APPROVED")}
          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Approve
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          disabled={busy}
          onClick={() => onStatus("REJECTED")}
          className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          <X className="h-4 w-4" /> Reject
        </button>
      )}
      {status !== "PENDING" && (
        <button
          disabled={busy}
          onClick={() => onStatus("PENDING")}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          Back to pending
        </button>
      )}
      <button
        disabled={busy}
        onClick={onDelete}
        className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </button>
    </div>
  );
}
