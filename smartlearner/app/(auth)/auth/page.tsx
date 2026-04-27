import AuthForm from "@/components/auth/AuthForm";
import { GraduationCap } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-bg)]">
      {/* Left Panel: Brand / Illustration Side */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-[#f0f0f9] p-12 relative overflow-hidden">
        {/* Abstract gradient background */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, #a391ff, transparent 50%), radial-gradient(circle at bottom left, #60fcc6, transparent 50%)",
          }}
        />

        {/* Logo */}
        <div className="z-10">
          <h1 className="font-heading font-extrabold text-3xl tracking-tight text-primary flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            SmartLearner
          </h1>
        </div>

        {/* Headline */}
        <div className="z-10 max-w-md">
          <h2 className="font-heading font-extrabold text-5xl tracking-tight leading-tight mb-6 text-text">
            Unlock your potential. <br />
            <span className="text-primary">Master anything.</span>
          </h2>
          <p className="text-text-muted text-lg">
            Join our community of learners. Experience personalized study paths
            designed to elevate your mind.
          </p>
        </div>

        {/* Decorative image area */}
        <div className="z-10 w-full h-64 rounded-xl overflow-hidden shadow-[0_12px_32px_rgba(108,71,255,0.12)] bg-gradient-to-br from-primary-light to-[#f0f0f9] flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🧠✨📚</div>
            <p className="text-text-muted font-medium text-sm">
              AI-powered spaced repetition that makes learning stick
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Form Side */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 relative bg-white">
        {/* Mobile Brand (Hidden on Desktop) */}
        <div className="md:hidden w-full flex justify-center mb-8">
          <h1 className="font-heading font-extrabold text-2xl tracking-tight text-primary flex items-center gap-2">
            <GraduationCap className="w-7 h-7" />
            SmartLearner
          </h1>
        </div>

        <AuthForm />
      </div>
    </div>
  );
}
