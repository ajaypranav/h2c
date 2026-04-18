"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/cn";
import { X, Sparkles, Lightbulb, Loader2 } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const ratingOptions = [
  { label: "Forgot", rating: 1, emoji: "🔴", color: "#FF4757", bgColor: "#FFF0F1" },
  { label: "Hard", rating: 3, emoji: "🟡", color: "#FFB800", bgColor: "#FFF8E6" },
  { label: "Good", rating: 4, emoji: "🟢", color: "#00C896", bgColor: "#E6FFF6" },
  { label: "Easy", rating: 5, emoji: "⭐", color: "#3B82F6", bgColor: "#EFF6FF" },
];

async function fetchQueue() {
  const res = await fetch("/api/reviews/queue");
  if (!res.ok) throw new Error("Failed to fetch review queue");
  return res.json();
}

async function startSession() {
  const res = await fetch("/api/reviews/session/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  if (!res.ok) throw new Error("Failed to start session");
  return res.json();
}

async function submitCard(sessionId: string, cardId: string, rating: number) {
  const res = await fetch(`/api/reviews/session/${sessionId}/submit-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId, rating }),
  });
  if (!res.ok) throw new Error("Failed to submit card");
  return res.json();
}

async function completeSession(sessionId: string) {
  const res = await fetch(`/api/reviews/session/${sessionId}/complete`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to complete session");
  return res.json();
}

export default function ReviewPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [results, setResults] = useState<{ cardId: string; rating: number }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [xpPopup, setXpPopup] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false });
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch due cards
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["reviewQueue"],
    queryFn: fetchQueue,
  });

  const cards = queueData?.data?.cards || [];
  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  // Start session when cards are loaded
  useEffect(() => {
    if (cards.length > 0 && !sessionId) {
      startSession().then((res) => {
        if (res.data?.session?.id) {
          setSessionId(res.data.session.id);
        }
      });
    }
  }, [cards.length, sessionId]);

  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      setIsFlipped(true);
      setShowRating(true);
    }
  }, [isFlipped]);

  const handleRate = useCallback(async (rating: number) => {
    if (!sessionId || !currentCard || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await submitCard(sessionId, currentCard.id, rating);
      const xp = res.data?.xpEarned || 0;

      setXpEarned((prev) => prev + xp);
      setResults((prev) => [...prev, { cardId: currentCard.id, rating }]);

      // Show XP popup for passing grades
      if (rating >= 3 && xp > 0) {
        setXpPopup({ amount: xp, visible: true });
        setTimeout(() => setXpPopup({ amount: 0, visible: false }), 800);
      }

      // Move to next card
      setTimeout(async () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= cards.length) {
          // Complete the session
          const completeRes = await completeSession(sessionId);
          setSessionResult(completeRes.data);
          setIsComplete(true);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#6C47FF", "#FF6B35", "#00C896", "#FFB800"],
          });
        } else {
          setCurrentIndex(nextIndex);
          setIsFlipped(false);
          setShowRating(false);
          setShowHint(false);
        }
        setIsSubmitting(false);
      }, 300);
    } catch (error) {
      console.error("Failed to submit card:", error);
      setIsSubmitting(false);
    }
  }, [sessionId, currentCard, currentIndex, cards.length, isSubmitting]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete || isSubmitting) return;
      if (e.code === "Space" && !isFlipped) {
        e.preventDefault();
        handleFlip();
      }
      if (isFlipped && showRating) {
        if (e.key === "1") handleRate(1);
        if (e.key === "2") handleRate(3);
        if (e.key === "3") handleRate(4);
        if (e.key === "4") handleRate(5);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, showRating, isComplete, handleFlip, handleRate, isSubmitting]);

  // Loading state
  if (queueLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-muted font-medium">Loading your review cards...</p>
        </div>
      </div>
    );
  }

  // No cards due
  if (cards.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">🎉</p>
          <h2 className="text-3xl font-extrabold text-text mb-2">All caught up!</h2>
          <p className="text-text-muted mb-8">You have no cards due for review right now. Come back later or add a new topic!</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-[var(--radius-full)] bg-surface-2 text-text text-sm font-semibold hover:bg-surface-3 transition-all"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/topics/new"
              className="px-6 py-3 rounded-[var(--radius-full)] bg-gradient-to-r from-primary to-[#8B5CF6] text-white text-sm font-bold hover:shadow-glow transition-all"
            >
              Add a Topic
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Session complete
  if (isComplete) {
    const accuracy = results.length > 0
      ? Math.round((results.filter((r) => r.rating >= 3).length / results.length) * 100)
      : 0;

    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md animate-bounce-in">
          <h1 className="text-4xl font-extrabold text-text mb-2">Session Complete! 🎉</h1>
          <p className="text-text-muted mb-8">Great job! Here&apos;s how you did:</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-sm">
              <p className="text-2xl font-extrabold text-text">{cards.length}</p>
              <p className="text-text-muted text-xs">Cards Reviewed</p>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-sm">
              <p className="text-2xl font-extrabold text-success">{accuracy}%</p>
              <p className="text-text-muted text-xs">Accuracy</p>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-sm">
              <p className="text-2xl font-extrabold text-secondary">+{xpEarned}</p>
              <p className="text-text-muted text-xs">XP Earned</p>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-sm">
              <p className="text-2xl font-extrabold text-text">🔥 {sessionResult?.streakCount || 0}</p>
              <p className="text-text-muted text-xs">Day Streak</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
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

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-[var(--radius-full)] bg-surface-2 flex items-center justify-center text-text-muted hover:bg-surface-3 hover:text-text transition-all"
        >
          <X size={18} />
        </Link>

        <p className="text-sm font-semibold text-text-muted">
          Card {currentIndex + 1} of {cards.length}
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm">🔥</span>
          <span className="px-2.5 py-1 rounded-[var(--radius-full)] bg-secondary-light text-secondary text-xs font-bold">
            +{xpEarned} XP
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-2 rounded-[var(--radius-full)] h-2 mb-8 overflow-hidden">
        <div
          className="h-full rounded-[var(--radius-full)] bg-gradient-to-r from-primary to-success transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flip Card */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* XP Popup */}
        {xpPopup.visible && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-float-up text-secondary font-extrabold text-xl z-10">
            +{xpPopup.amount} XP
          </div>
        )}

        {/* Topic badge */}
        {currentCard?.topic && (
          <div className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-full)] bg-surface-2 text-text-muted text-xs font-medium">
            <span>{currentCard.topic.emoji}</span>
            <span>{currentCard.topic.title}</span>
          </div>
        )}

        <div
          className="perspective-1000 w-full max-w-lg cursor-pointer"
          onClick={handleFlip}
        >
          <div
            className={cn(
              "relative w-full min-h-[280px] preserve-3d transition-transform duration-[600ms]",
              isFlipped && "rotate-y-180"
            )}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden rounded-[var(--radius-xl)] bg-surface p-8 shadow-lg flex flex-col items-center justify-center text-center">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">Question</p>
              <p className="text-xl font-bold text-text leading-relaxed">{currentCard?.front}</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[var(--radius-xl)] bg-gradient-to-br from-primary-light to-surface p-8 shadow-lg flex flex-col items-center justify-center text-center">
              <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-4">Answer</p>
              <p className="text-base font-medium text-text leading-relaxed">{currentCard?.back}</p>
            </div>
          </div>
        </div>

        {/* Show Answer Button (front only) */}
        {!isFlipped && (
          <div className="mt-6 space-y-3 text-center">
            <button
              onClick={handleFlip}
              className="px-8 py-3 rounded-[var(--radius-full)] bg-primary text-white text-sm font-bold hover:bg-primary-dim hover:shadow-glow transition-all active:scale-[0.98]"
            >
              Show Answer
            </button>

            {currentCard?.hint && (
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(!showHint);
                  }}
                  className="flex items-center gap-1.5 text-text-muted text-xs font-medium hover:text-primary transition-colors mx-auto"
                >
                  <Lightbulb size={12} />
                  {showHint ? "Hide hint" : "Show hint"}
                </button>
                {showHint && (
                  <p className="text-primary text-sm mt-2 animate-bounce-in">{currentCard.hint}</p>
                )}
              </div>
            )}

            <p className="text-text-light text-xs">Press Space to flip</p>
          </div>
        )}

        {/* Rating Buttons (back only) */}
        {isFlipped && showRating && (
          <div className="mt-6 flex items-center gap-3">
            {ratingOptions.map((option, i) => (
              <button
                key={option.rating}
                onClick={() => handleRate(option.rating)}
                disabled={isSubmitting}
                className={cn(
                  "flex flex-col items-center gap-1 px-5 py-3 rounded-[var(--radius-lg)] font-semibold text-sm transition-all hover:scale-105 active:scale-95",
                  "animate-bounce-in",
                  isSubmitting && "opacity-50 pointer-events-none"
                )}
                style={{
                  backgroundColor: option.bgColor,
                  color: option.color,
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <span className="text-lg">{option.emoji}</span>
                <span className="text-xs">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
