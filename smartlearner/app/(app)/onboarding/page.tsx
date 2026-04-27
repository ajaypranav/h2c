"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { TOPIC_EMOJIS, TOPIC_COLORS } from "@/types";
import { ChevronRight, ChevronLeft, Sparkles, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";

const LEARNING_GOALS = [
  { id: "exams", icon: "📝", label: "Study for Exams" },
  { id: "skill", icon: "🎯", label: "Learn a Skill" },
  { id: "professional", icon: "💼", label: "Professional Development" },
  { id: "curiosity", icon: "🔮", label: "Personal Curiosity" },
];

const AVATAR_EMOJIS = ["😊", "🤓", "😎", "🧑‍💻", "🎓", "🦊", "🐱", "🦉", "🚀", "⭐", "🌟", "🎨"];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("🤓");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [goal, setGoal] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [topicNotes, setTopicNotes] = useState("");
  const [topicEmoji, setTopicEmoji] = useState("📚");
  const [topicColor, setTopicColor] = useState("#6C47FF");
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = async () => {
    if (!topicTitle.trim()) {
      toast.error("Please enter a topic title!");
      return;
    }

    setGenerating(true);

    try {
      // Step 1: Sync user profile to DB
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          avatar,
          timezone,
          learningGoal: goal || undefined,
        }),
      });

      // Step 2: Create first topic
      const topicRes = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topicTitle.trim(),
          rawNotes: topicNotes.trim() || undefined,
          emoji: topicEmoji,
          color: topicColor,
        }),
      });

      const topicData = await topicRes.json();
      if (!topicRes.ok) {
        throw new Error(topicData.error?.message || "Failed to create topic");
      }

      // Mark onboarding as complete in Supabase user metadata
      // (middleware reads this flag on the Edge to gate protected routes)
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { onboarding_complete: true } });

      setGenerating(false);

      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6C47FF", "#FF6B35", "#00C896", "#FFB800"],
      });

      toast.success("🎉 Your first study plan is ready!");
      router.push("/dashboard");
    } catch (error: any) {
      setGenerating(false);
      toast.error(error.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="w-full bg-surface-2 rounded-[var(--radius-full)] h-2 mb-8 overflow-hidden">
          <div
            className="h-full rounded-[var(--radius-full)] bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center text-xs font-bold transition-all",
                i + 1 < step
                  ? "bg-success text-white"
                  : i + 1 === step
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-text-muted"
              )}
            >
              {i + 1 < step ? <Check size={14} /> : i + 1}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="rounded-[var(--radius-xl)] bg-surface p-8 shadow-md">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-text">Welcome to SmartLearner! 🎉</h2>
                <p className="text-text-muted text-sm mt-2">Let&apos;s set up your profile</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full px-4 py-3 rounded-[var(--radius-full)] bg-surface-3 text-text text-sm placeholder:text-text-light focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-light transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Choose your avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setAvatar(emoji)}
                      className={cn(
                        "w-11 h-11 rounded-[var(--radius-full)] flex items-center justify-center text-xl transition-all",
                        avatar === emoji
                          ? "bg-primary-light ring-2 ring-primary scale-110"
                          : "bg-surface-2 hover:bg-surface-3"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 rounded-[var(--radius-full)] bg-surface-3 text-text text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-light transition-all appearance-none"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">GMT / London</option>
                  <option value="Europe/Paris">CET / Paris</option>
                  <option value="Asia/Kolkata">IST / India</option>
                  <option value="Asia/Tokyo">JST / Tokyo</option>
                  <option value="Australia/Sydney">AEST / Sydney</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Choose Goal */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-text">What&apos;s your goal? 🎯</h2>
                <p className="text-text-muted text-sm mt-2">This helps us personalize your experience</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {LEARNING_GOALS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setGoal(item.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-[var(--radius-lg)] text-left transition-all duration-200",
                      goal === item.id
                        ? "bg-primary-light ring-2 ring-primary"
                        : "bg-surface-2 hover:bg-surface-3"
                    )}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-semibold text-text text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: First Topic */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-text">Your first topic! 📚</h2>
                <p className="text-text-muted text-sm mt-2">What would you like to learn?</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g. Photosynthesis, React Hooks..."
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-[var(--radius-full)] bg-surface-3 text-text text-sm placeholder:text-text-light focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-light transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_EMOJIS.slice(0, 12).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setTopicEmoji(emoji)}
                      className={cn(
                        "w-10 h-10 rounded-[var(--radius-full)] flex items-center justify-center text-lg transition-all",
                        topicEmoji === emoji
                          ? "bg-primary-light ring-2 ring-primary scale-110"
                          : "bg-surface-2 hover:bg-surface-3"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {TOPIC_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTopicColor(color)}
                      className={cn(
                        "w-9 h-9 rounded-[var(--radius-full)] transition-all",
                        topicColor === color && "ring-2 ring-offset-2 ring-text scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  placeholder="Paste your notes, a chapter summary, anything... AI will do the rest. Or leave blank!"
                  maxLength={5000}
                  rows={4}
                  className="w-full px-4 py-3 rounded-[var(--radius-lg)] bg-surface-3 text-text text-sm placeholder:text-text-light focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-light transition-all resize-none"
                />
                <p className="text-text-light text-xs mt-1">
                  {topicNotes.length}/5000 chars · We&apos;ll generate ~{topicNotes.length > 500 ? 15 : 10} cards
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <div>
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-text-muted text-sm font-semibold hover:text-text transition-colors"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step < 3 && (
                <button
                  onClick={handleNext}
                  className="text-text-muted text-sm font-medium hover:text-text transition-colors"
                >
                  Skip for now
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-[var(--radius-full)] bg-primary text-white text-sm font-bold hover:bg-primary-dim hover:shadow-glow transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={generating || !topicTitle.trim()}
                  className={cn(
                    "px-6 py-2.5 rounded-[var(--radius-full)] bg-gradient-to-r from-primary to-[#8B5CF6] text-white text-sm font-bold transition-all active:scale-[0.98] flex items-center gap-2",
                    "hover:from-primary-dim hover:to-[#7C3AED] hover:shadow-glow",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating cards...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Study Plan
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
