"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { X, Sparkles, Lightbulb, Loader2, RefreshCw, LayoutDashboard, Flame, Award } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getLevelProgress } from "@/lib/xp";

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
    method: "POST", headers: { "Content-Type": "application/json" },
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

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

interface SessionResultData {
  streakCount?: number;
  newLevel?: number;
  totalXP?: number;
  badgesEarned?: { id: string; name: string; icon: string }[];
}

export default function ReviewPage() {
  useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [results, setResults] = useState<{ cardId: string; rating: number }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [xpPopup, setXpPopup] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false });
  const [sessionResult, setSessionResult] = useState<SessionResultData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionStartTime = useRef<number>(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["reviewQueue"],
    queryFn: fetchQueue,
  });

  const cards = queueData?.data?.cards || [];
  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  useEffect(() => {
    if (cards.length > 0 && !sessionId) {
      sessionStartTime.current = Date.now();
      startSession().then((res) => {
        if (res.data?.session?.id) setSessionId(res.data.session.id);
      });
    }
  }, [cards.length, sessionId]);

  const handleFlip = useCallback(() => {
    if (!isFlipped) { setIsFlipped(true); setShowRating(true); }
  }, [isFlipped]);

  const handleRate = useCallback(async (rating: number) => {
    if (!sessionId || !currentCard || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await submitCard(sessionId, currentCard.id, rating);
      const xp = res.data?.xpEarned || 0;
      setXpEarned((prev) => prev + xp);
      setResults((prev) => [...prev, { cardId: currentCard.id, rating }]);
      if (rating >= 3 && xp > 0) {
        setXpPopup({ amount: xp, visible: true });
        setTimeout(() => setXpPopup({ amount: 0, visible: false }), 800);
      }
      setTimeout(async () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= cards.length) {
          const elapsed = Math.floor((Date.now() - sessionStartTime.current) / 1000);
          setSessionDuration(elapsed);
          const completeRes = await completeSession(sessionId);
          setSessionResult(completeRes.data);
          setIsComplete(true);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#6C47FF", "#FF6B35", "#00C896", "#FFB800"] });
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete || isSubmitting) return;
      if (e.code === "Space" && !isFlipped) { e.preventDefault(); handleFlip(); }
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

  if (queueLoading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
        <p className="text-text-muted font-medium">Loading your review cards...</p>
      </div>
    </div>
  );

  if (cards.length === 0) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">🎉</p>
        <h2 className="text-3xl font-extrabold text-text mb-2">All caught up!</h2>
        <p className="text-text-muted mb-8">You have no cards due for review right now. Come back later or add a new topic!</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard" className="px-6 py-3 rounded-full bg-[#f0f0f9] text-text text-sm font-semibold hover:bg-[#e2e2ec] transition-all">Back to Dashboard</Link>
          <Link href="/topics/new" className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-[#8B5CF6] text-white text-sm font-bold hover:shadow-glow transition-all">Add a Topic</Link>
        </div>
      </div>
    </div>
  );

  // Session Complete Screen
  if (isComplete) {
    const accuracy = results.length > 0 ? Math.round((results.filter((r) => r.rating >= 3).length / results.length) * 100) : 0;
    const totalXP = sessionResult?.totalXP || xpEarned;
    const newLevel = sessionResult?.newLevel || 1;
    const streakCount = sessionResult?.streakCount || 0;
    const levelInfo = getLevelProgress(totalXP);
    const xpToNext = levelInfo.nextLevelXP - totalXP;
    const badges = sessionResult?.badgesEarned || [];

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl flex flex-col items-center">
          {/* Hero */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text mb-2">Session Complete! 🎉</h1>
            <p className="text-text-muted text-lg">You&apos;re crushing your learning goals today.</p>
          </div>

          {/* Stats Card */}
          <div className="w-full bg-white p-8 md:p-10 rounded-2xl shadow-[0_12px_32px_rgba(108,71,255,0.12)] mb-8 border border-border-muted">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { icon: <Sparkles size={22} className="text-primary" />, value: cards.length, label: "Cards", bg: "rgba(163,145,255,0.15)" },
                { icon: <Award size={22} className="text-[#00694d]" />, value: `${accuracy}%`, label: "Accuracy", bg: "rgba(96,252,198,0.2)" },
                { icon: <Sparkles size={22} className="text-secondary" />, value: `+${xpEarned}`, label: "XP", bg: "rgba(255,196,178,0.2)" },
                { icon: <X size={22} className="text-text-muted" />, value: formatDuration(sessionDuration), label: "Time", bg: "#e2e2ec" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>{s.icon}</div>
                  <span className="text-2xl font-bold text-text">{s.value}</span>
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Streak Banner */}
            {streakCount > 0 && (
              <div className="bg-secondary-light rounded-full py-4 px-6 flex items-center justify-center gap-3 mb-8">
                <Flame size={24} className="text-secondary animate-flicker" />
                <span className="text-text font-bold text-lg">{streakCount} day streak! Keep it up!</span>
              </div>
            )}

            {/* Badge Reveal */}
            {badges.length > 0 && (
              <div className="flex flex-col md:flex-row items-center gap-6 bg-[#f8f7ff] p-6 rounded-2xl relative overflow-hidden mb-2">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-light/30 to-success-light/30 opacity-50" />
                {badges.map((badge) => (
                  <div key={badge.id} className="relative flex items-center gap-4 animate-bounce-in">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-light to-success-light rounded-full blur-xl animate-pulse opacity-40" />
                      <div className="relative w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center border-4 border-primary-light">
                        <span className="text-3xl">{badge.icon}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <h3 className="text-lg font-bold text-primary mb-0.5">New Badge: {badge.name}</h3>
                      <p className="text-text-muted text-sm">Achievement unlocked!</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Level Progress */}
          <div className="w-full max-w-md mb-10">
            <div className="flex justify-between items-end mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-text-muted text-sm font-bold uppercase tracking-widest">Level</span>
                <span className="text-3xl font-black text-primary">{newLevel}</span>
              </div>
              <span className="text-text-muted text-sm font-bold">{totalXP.toLocaleString()} / {levelInfo.nextLevelXP.toLocaleString()} XP</span>
            </div>
            <div className="h-6 w-full bg-[#e2e2ec] rounded-full p-1.5 shadow-inner">
              <div className="h-full bg-gradient-to-r from-primary to-success rounded-full relative transition-all duration-1000" style={{ width: `${levelInfo.progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full border-4 border-success shadow-sm" />
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-bold text-text-light uppercase">Next Level</span>
              <span className="text-xs font-black text-success uppercase">{xpToNext} XP to Level {newLevel + 1}</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={() => { setIsComplete(false); setCurrentIndex(0); setResults([]); setXpEarned(0); setSessionId(null); setIsFlipped(false); setShowRating(false); setSessionResult(null); sessionStartTime.current = Date.now(); }}
              className="px-10 py-4 bg-primary text-white rounded-full font-bold text-base shadow-[0_12px_32px_rgba(108,71,255,0.25)] hover:bg-primary-dim transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Review More
            </button>
            <Link href="/dashboard" className="px-10 py-4 border-2 border-primary text-primary rounded-full font-bold text-base hover:bg-primary-light transition-all active:scale-95 flex items-center justify-center gap-2">
              <LayoutDashboard size={18} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Review UI
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-[#f0f0f9] flex items-center justify-center text-text-muted hover:bg-[#e2e2ec] hover:text-text transition-all">
          <X size={18} />
        </Link>
        <p className="text-sm font-semibold text-text-muted">Card {currentIndex + 1} of {cards.length}</p>
        <div className="flex items-center gap-3">
          <span className="text-sm">🔥</span>
          <span className="px-2.5 py-1 rounded-full bg-secondary-light text-secondary text-xs font-bold">+{xpEarned} XP</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#e2e2ec] rounded-full h-2 mb-8 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Flip Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {xpPopup.visible && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-float-up text-secondary font-extrabold text-xl z-10">+{xpPopup.amount} XP</div>
        )}

        {currentCard?.topic && (
          <div className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f0f9] text-text-muted text-xs font-medium">
            <span>{currentCard.topic.emoji}</span>
            <span>{currentCard.topic.title}</span>
          </div>
        )}

        <div className="perspective-1000 w-full max-w-lg cursor-pointer" onClick={handleFlip}>
          <div className={cn("relative w-full min-h-[280px] preserve-3d transition-transform duration-[600ms]", isFlipped && "rotate-y-180")}>
            <div className="absolute inset-0 backface-hidden rounded-2xl bg-white p-8 shadow-lg flex flex-col items-center justify-center text-center">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">Question</p>
              <p className="text-xl font-bold text-text leading-relaxed">{currentCard?.front}</p>
            </div>
            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br from-primary-light to-white p-8 shadow-lg flex flex-col items-center justify-center text-center">
              <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-4">Answer</p>
              <p className="text-base font-medium text-text leading-relaxed">{currentCard?.back}</p>
            </div>
          </div>
        </div>

        {!isFlipped && (
          <div className="mt-6 space-y-3 text-center">
            <button onClick={handleFlip} className="px-8 py-3 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-dim hover:shadow-glow transition-all active:scale-[0.98]">Show Answer</button>
            {currentCard?.hint && (
              <div>
                <button onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }} className="flex items-center gap-1.5 text-text-muted text-xs font-medium hover:text-primary transition-colors mx-auto">
                  <Lightbulb size={12} /> {showHint ? "Hide hint" : "Show hint"}
                </button>
                {showHint && <p className="text-primary text-sm mt-2 animate-bounce-in">{currentCard.hint}</p>}
              </div>
            )}
            <p className="text-text-light text-xs">Press Space to flip</p>
          </div>
        )}

        {isFlipped && showRating && (
          <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
            {ratingOptions.map((option, i) => (
              <button key={option.rating} onClick={() => handleRate(option.rating)} disabled={isSubmitting}
                className={cn("flex flex-col items-center gap-1 px-5 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 animate-bounce-in min-w-[72px]",
                  isSubmitting && "opacity-50 pointer-events-none")}
                style={{ backgroundColor: option.bgColor, color: option.color, animationDelay: `${i * 50}ms` }}>
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
