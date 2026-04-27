import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl mb-6">🔮</p>
        <h1 className="text-5xl font-extrabold text-text mb-3 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-text mb-4">Page not found</h2>
        <p className="text-text-muted text-sm mb-10 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-[#8B5CF6] text-white text-sm font-bold hover:shadow-glow transition-all active:scale-[0.98]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-8 py-3.5 rounded-full bg-[#f0f0f9] text-text text-sm font-semibold hover:bg-[#e2e2ec] transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
