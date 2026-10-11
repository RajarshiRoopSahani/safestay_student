"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, PenLine, Star } from "lucide-react";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import RatingStars from "@/components/RatingStars";
import ReportModal from "@/components/ReportModal";
import ReviewCard from "@/components/ReviewCard";
import { useAuth } from "@/hooks/useAuth";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { getErrorMessage } from "@/services/api";
import { fetchReviews, submitReview } from "@/services/reviewService";
import { ReviewsResponse } from "@/types";

const STATUS_NOTE: Record<string, string> = {
  PENDING: "Awaiting moderation. It will appear publicly once approved.",
  APPROVED: "Published.",
  REJECTED: "Not published.",
};

export default function ReviewsSection({ propertyId }: { propertyId: string }) {
  const { user, loading: authLoading } = useAuth();
  const requireLogin = useRequireLogin();
  const userId = user?.id ?? null;

  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchReviews(propertyId, page));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [propertyId, page]);

  // Reload when the page changes or when the user logs in or out (so "your review" updates).
  useEffect(() => {
    if (authLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, authLoading, userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (rating < 1) {
      setFormError("Please choose a star rating.");
      return;
    }
    if (text.trim().length < 10) {
      setFormError("Please write at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await submitReview(propertyId, rating, text.trim());
      setShowForm(false);
      setRating(0);
      setText("");
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Student reviews</h2>

      {error ? (
        <div className="mt-4">
          <ErrorMessage message={error} onRetry={load} />
        </div>
      ) : !data ? (
        <LoadingSpinner label="Loading reviews..." />
      ) : (
        <div className={loading ? "opacity-60 transition" : "transition"}>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <RatingStars rating={data.rating} reviewCount={data.reviewCount} size="md" />
              <p className="mt-2 text-xs text-slate-500">
                Ratings come only from approved student reviews. A rating is shown once enough reviews exist.
              </p>
            </div>

            {data.total > 0 && (
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = data.distribution[star] ?? 0;
                  const pct = Math.round((count / data.total) * 100);
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-8">{star} ★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Write a review */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            {data.myReview ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Your review</h3>
                <ReviewCard review={data.myReview} />
                <p className="mt-2 text-xs text-slate-500">{STATUS_NOTE[data.myReview.status ?? "PENDING"]}</p>
              </div>
            ) : showForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Write a review</h3>
                {formError && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </p>
                )}
                <div className="flex gap-1" role="group" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setRating(i)}
                      aria-label={`${i} star${i > 1 ? "s" : ""}`}
                      aria-pressed={rating === i}
                    >
                      <Star className={`h-8 w-8 transition ${i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300"}`} />
                    </button>
                  ))}
                </div>
                <div>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share your honest experience: rooms, food, water, safety, staff, value for money."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{text.length} / 1000</p>
                </div>
                <p className="text-xs text-slate-500">
                  Your name is never shown. Reviews are checked by a moderator before they appear.
                </p>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => {
                  if (requireLogin()) setShowForm(true);
                }}
                className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <PenLine className="h-4 w-4" /> Write a review
              </button>
            )}
          </div>

          {/* List */}
          <div className="mt-6 space-y-3">
            {data.reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
                No approved reviews yet. Reviews appear here after moderation.
              </p>
            ) : (
              data.reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onReport={() => {
                    if (requireLogin()) setReportReviewId(r.id);
                  }}
                />
              ))
            )}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {reportReviewId && (
        <ReportModal
          title="Report this review"
          target={{ reviewId: reportReviewId }}
          defaultType="OTHER"
          onClose={() => setReportReviewId(null)}
        />
      )}
    </section>
  );
}
