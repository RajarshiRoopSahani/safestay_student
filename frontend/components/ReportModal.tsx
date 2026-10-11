"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import { getErrorMessage } from "@/services/api";
import { createReport } from "@/services/reportService";
import { ReportType } from "@/types";
import { REPORT_TYPE_LABEL } from "@/utils/format";

type Props = {
  title: string;
  target: { propertyId?: string; photoId?: string; reviewId?: string };
  defaultType?: ReportType;
  onClose: () => void;
};

const TYPES = Object.keys(REPORT_TYPE_LABEL) as ReportType[];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function ReportModal({ title, target, defaultType = "OTHER", onClose }: Props) {
  const [type, setType] = useState<ReportType>(defaultType);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (details.trim().length < 10) {
      setError("Please describe the issue in at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createReport({ type, details: details.trim(), ...target });
      setDoneMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      {doneMessage ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="text-sm text-slate-700">{doneMessage}</p>
          <button onClick={onClose} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="report-type" className="mb-1.5 block text-sm font-medium text-slate-700">
              What is the problem?
            </label>
            <select id="report-type" value={type} onChange={(e) => setType(e.target.value as ReportType)} className={inputClass}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {REPORT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="report-details" className="mb-1.5 block text-sm font-medium text-slate-700">
              Details
            </label>
            <textarea
              id="report-details"
              rows={4}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className={inputClass}
              placeholder="Tell us what looks wrong and why."
            />
            <p className="mt-1 text-right text-xs text-slate-400">{details.length} / 1000</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit report
          </button>
        </form>
      )}
    </Modal>
  );
}
