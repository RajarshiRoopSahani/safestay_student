import { Star } from "lucide-react";

type Props = {
  rating: number | null;
  reviewCount: number;
  size?: "sm" | "md";
};

export default function RatingStars({ rating, reviewCount, size = "sm" }: Props) {
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";

  // Never show a rating that doesn't exist.
  if (rating === null) {
    return (
      <p className="text-xs text-slate-500">
        Not enough reviews yet.
        {reviewCount > 0 && ` (${reviewCount} so far)`}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2" aria-label={`Rated ${rating} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${iconSize} ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          />
        ))}
      </div>
      <span className={`font-semibold text-slate-800 ${size === "md" ? "text-base" : "text-sm"}`}>
        {rating} / 5
      </span>
      <span className="text-xs text-slate-500">
        {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
      </span>
    </div>
  );
}
