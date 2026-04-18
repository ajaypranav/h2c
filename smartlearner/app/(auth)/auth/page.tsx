import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--color-bg)]">
      {/* Left Panel: Branding / Illustration */}
      <div className="hidden lg:flex flex-col justify-center items-center p-12 relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dim)] text-white">
        {/* Floating decorative elements */}
        <div className="absolute top-10 left-10 text-6xl opacity-20">📚</div>
        <div className="absolute bottom-20 right-20 text-6xl opacity-20">🚀</div>
        <div className="absolute top-1/3 right-10 text-6xl opacity-20">💡</div>
        
        <div className="z-10 max-w-lg text-center">
          <h1 className="text-5xl font-heading font-black mb-6 leading-tight">
            Learn Anything.<br />
            <span className="text-[var(--color-warning)]">Remember Everything.</span>
          </h1>
          <p className="text-lg text-[var(--color-primary-light)] mb-10 leading-relaxed font-medium">
            Join SmartLearner today. The AI-powered spaced repetition platform that turns studying into a game you actually want to play.
          </p>
          <div className="inline-flex items-center space-x-2 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20">
            <span className="text-xl">🔥</span>
            <span className="font-semibold text-white">100,000+ Flashcards Reviewed</span>
          </div>
        </div>

        {/* Abstract background blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[var(--color-success)] opacity-20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex flex-col justify-center p-6 lg:p-12 relative">
        <AuthForm />
      </div>
    </div>
  );
}
