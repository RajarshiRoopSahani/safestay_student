import { AlertCircle } from "lucide-react";

type Props = { message: string; onRetry?: () => void };

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center" role="alert">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
