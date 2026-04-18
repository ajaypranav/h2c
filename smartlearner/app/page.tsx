import Link from "next/link";
import { ArrowRight, Brain, Sparkles, BarChart3, Zap, Star, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-bg/80 border-b border-border-muted">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-gradient-to-br from-primary to-[#9B7BFF] flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-extrabold text-lg text-text">SmartLearner</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              className="px-5 py-2.5 rounded-[var(--radius-full)] bg-gradient-to-r from-primary to-[#8B5CF6] text-white text-sm font-bold hover:shadow-glow transition-all hover:from-primary-dim hover:to-[#7C3AED] active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] bg-primary-light text-primary text-sm font-semibold mb-8">
            <Sparkles size={14} />
            AI-Powered Learning
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-text leading-tight tracking-tight">
            Learn Anything.
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Remember Everything.
            </span>
          </h1>

          <p className="text-text-muted text-lg lg:text-xl max-w-2xl mx-auto mt-6 leading-relaxed">
            AI generates your study cards. Science schedules your reviews. Gamification keeps you coming back.
            Just tell us what you&apos;re learning — we handle the rest.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/auth"
              className="px-8 py-4 rounded-[var(--radius-full)] bg-gradient-to-r from-primary to-[#8B5CF6] text-white text-base font-bold hover:shadow-glow transition-all hover:from-primary-dim hover:to-[#7C3AED] active:scale-[0.98] flex items-center gap-2"
            >
              Start for Free <ArrowRight size={18} />
            </Link>
            <p className="text-text-light text-sm">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-text">
              Why SmartLearner? 🚀
            </h2>
            <p className="text-text-muted mt-3 max-w-xl mx-auto">
              We combine three powerful techniques that traditional apps miss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "AI Generates Your Cards",
                description: "Just paste your notes or enter a topic. Our AI creates perfectly structured flashcards in seconds.",
                color: "#6C47FF",
                bgColor: "#EDE9FF",
              },
              {
                icon: Brain,
                title: "Science-Backed Scheduling",
                description: "SM-2 spaced repetition ensures you review at the optimal moment — right before you forget.",
                color: "#00C896",
                bgColor: "#E6FFF6",
              },
              {
                icon: Zap,
                title: "Gamified Progress",
                description: "Earn XP, maintain streaks, unlock badges, and level up. Learning should feel like a game.",
                color: "#FF6B35",
                bgColor: "#FFF0EB",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-[var(--radius-xl)] bg-surface p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              >
                <div
                  className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-5"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <feature.icon size={22} style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">{feature.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-surface-2/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-text">
              How it works ✨
            </h2>
            <p className="text-text-muted mt-3">Three simple steps to mastery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Log Your Topic",
                description: "Enter a topic name or paste your notes, a textbook excerpt, a YouTube transcript — anything.",
                emoji: "📝",
              },
              {
                step: "02",
                title: "AI Creates Cards",
                description: "Our AI reads your material and generates smart, targeted review cards automatically.",
                emoji: "🤖",
              },
              {
                step: "03",
                title: "Review & Remember",
                description: "Review your cards daily with spaced repetition. Earn XP and grow your streak.",
                emoji: "🧠",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-surface flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
                  {item.emoji}
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-full)] bg-primary text-white text-xs font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-text mb-2">{item.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={20} fill="#FFB800" stroke="#FFB800" />
            ))}
          </div>
          <p className="text-text-muted text-sm font-medium mb-8">
            Rated 4.9/5 by early learners
          </p>

          <div className="flex flex-col items-center gap-4">
            {[
              { text: "No more manual flashcard creation", icon: CheckCircle2 },
              { text: "Works for any subject or skill", icon: CheckCircle2 },
              { text: "Science-backed retention guarantee", icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-text">
                <item.icon size={18} className="text-success shrink-0" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center rounded-[var(--radius-xl)] bg-gradient-to-br from-primary via-primary-dim to-[#8B5CF6] p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Ready to learn smarter? 🧠
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
              Join thousands of learners who are mastering new skills with AI-powered spaced repetition.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-[var(--radius-full)] bg-white text-primary text-base font-bold hover:bg-white/90 hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Start Learning — It&apos;s Free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border-muted">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-gradient-to-br from-primary to-[#9B7BFF] flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="font-bold text-sm text-text">SmartLearner</span>
          </div>
          <div className="flex items-center gap-6 text-text-muted text-xs">
            <a href="#" className="hover:text-text transition-colors">Privacy</a>
            <a href="#" className="hover:text-text transition-colors">Terms</a>
            <a href="#" className="hover:text-text transition-colors">GitHub</a>
          </div>
          <p className="text-text-light text-xs">
            © 2024 SmartLearner. Learn anything, remember everything.
          </p>
        </div>
      </footer>
    </div>
  );
}
