import { BadgeCheck, Flag, Star, UserRound } from "lucide-react";
import { Review } from "@/types";
import { formatDate } from "@/utils/format";

type Props = { review: Review; onReport?: () => void };

export default function ReviewCard({ review, onReport }: Props) {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 p-2 text-slate-500">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <p className={`flex items-center gap-1 text-sm font-medium ${review.verified ? "text-emerald-700" : "text-slate-700"}`}>
              {review.verified && <BadgeCheck className="h-4 w-4" />} {review.label}
            </p>
            <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex" aria-label={`Rated ${review.rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`h-4 w-4 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          ))}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{review.text}</p>

      {onReport && (
        <button onClick={onReport} className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-red-600">
          <Flag className="h-3.5 w-3.5" /> Report review
        </button>
      )}
    </article>
  );
}
