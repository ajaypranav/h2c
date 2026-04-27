"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">😵</p>
        <h2 className="text-2xl font-extrabold text-text mb-2">Something went wrong</h2>
        <p className="text-text-muted text-sm mb-8">
          We hit an unexpected error. Don&apos;t worry — your data is safe.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-[var(--radius-full)] bg-gradient-to-r from-primary to-[#8B5CF6] text-white text-sm font-bold hover:shadow-glow transition-all active:scale-[0.98]"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-[var(--radius-full)] bg-surface-2 text-text text-sm font-semibold hover:bg-surface-3 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
