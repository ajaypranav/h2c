"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  Flame,
  Plus,
  Clock,
  Sparkles,
  ChevronRight,
  Zap,
  BookOpen,
  Target,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLevelProgress } from "@/lib/xp";

function MasteryRing({ score, size = 48, strokeWidth = 4 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? "#00C896" : score >= 50 ? "#FFB800" : "#FF4757";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-surface-2" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning! ☀️";
  if (hour < 17) return "Good afternoon! 🌤️";
  return "Good evening! 🌙";
}

async function fetchDashboard() {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

async function fetchTopics() {
  const res = await fetch("/api/topics");
  if (!res.ok) throw new Error("Failed to fetch topics");
  return res.json();
}

export default function DashboardPage() {
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: fetchTopics,
  });

  const dashboard = dashData?.data;
  const topics = topicsData?.data?.topics || [];
  const isLoading = dashLoading || topicsLoading;

  const dueCount = dashboard?.dueCount ?? 0;
  const streak = dashboard?.streak ?? 0;
  const xp = dashboard?.xp ?? 0;
  const levelInfo = getLevelProgress(xp);
  const level = levelInfo.level;
  const xpProgress = levelInfo.progress;
  const xpToNext = levelInfo.nextLevelXP - xp;
  const recentActivity = dashboard?.recentActivity || [];

  const estimatedMinutes = Math.max(1, Math.ceil(dueCount * 0.4));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-[var(--radius-md)]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-52 animate-shimmer rounded-[var(--radius-xl)]" />
          <div className="space-y-4">
            <div className="h-24 animate-shimmer rounded-[var(--radius-xl)]" />
            <div className="h-24 animate-shimmer rounded-[var(--radius-xl)]" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-shimmer rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text">{getGreeting()}</h1>
        <p className="text-text-muted mt-1">Here&apos;s what&apos;s on your plate today.</p>
      </div>

      {/* Hero Row: Daily Review + Streak + XP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Review Card */}
        <div
          className={cn(
            "lg:col-span-2 relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-primary via-primary-dim to-[#8B5CF6] p-6 text-white",
            dueCount > 0 && "animate-pulse-glow"
          )}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="opacity-70" />
              <span className="text-sm font-medium opacity-70">Daily Review</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {dueCount > 0 ? (
                  <>
                    <h2 className="text-4xl font-extrabold mb-1">{dueCount} cards</h2>
                    <p className="text-white/70 text-sm">due today · ~{estimatedMinutes} min</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-extrabold mb-1">🎉 All caught up!</h2>
                    <p className="text-white/70 text-sm">No cards due today. Great job!</p>
                  </>
                )}
              </div>

              {dueCount > 0 && (
                <div className="relative">
                  <MasteryRing score={Math.min(100, Math.round((1 - dueCount / Math.max(1, dueCount + 5)) * 100))} size={72} strokeWidth={6} />
                </div>
              )}
            </div>

            {dueCount > 0 ? (
              <Link
                href="/review"
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-[var(--radius-full)] bg-white text-primary font-bold text-sm hover:bg-white/90 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <Sparkles size={16} />
                Start Review
              </Link>
            ) : (
              <Link
                href="/topics/new"
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-[var(--radius-full)] bg-white text-primary font-bold text-sm hover:bg-white/90 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <Plus size={16} />
                Add New Topic
              </Link>
            )}
          </div>
        </div>

        {/* Streak + XP Stack */}
        <div className="space-y-4">
          {/* Streak */}
          <div className="rounded-[var(--radius-xl)] bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn("text-3xl", streak > 0 && "animate-flicker")}>🔥</div>
              <div>
                <span className="text-2xl font-extrabold text-text">{streak}</span>
                <p className="text-text-muted text-xs font-medium">day streak</p>
              </div>
            </div>
            <p className="text-text-muted text-xs mt-2">
              {streak > 0 ? "Keep your streak alive! 🎯" : "Start reviewing to begin your streak!"}
            </p>
          </div>

          {/* XP & Level */}
          <div className="rounded-[var(--radius-xl)] bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] bg-primary-light text-primary text-xs font-bold">
                  👑 Lvl {level}
                </span>
              </div>
              <span className="text-text-muted text-xs font-semibold">{xp} XP</span>
            </div>
            <div className="w-full bg-surface-2 rounded-[var(--radius-full)] h-2.5 overflow-hidden">
              <div
                className="h-full rounded-[var(--radius-full)] bg-gradient-to-r from-primary to-secondary transition-all duration-700 ease-out"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-text-light text-[10px] mt-1.5 font-medium">{xpToNext} XP to next level</p>
          </div>
        </div>
      </div>

      {/* Pending Retention Schedules */}
      {dashboard?.pendingTopicSchedules && dashboard.pendingTopicSchedules.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
            <Target size={20} className="text-primary" /> Topic Retention Plan Due
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {dashboard.pendingTopicSchedules.map((schedule: any) => (
              <div
                key={schedule.id}
                className="group relative rounded-[var(--radius-lg)] bg-surface p-5 shadow-sm border border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${schedule.topic.color}15` }}
                    >
                      {schedule.topic.emoji}
                    </div>
                    <div>
                      <h4 className="font-semibold text-text text-sm">{schedule.topic.title}</h4>
                      <p className="text-text-light text-[10px] mt-0.5">Interval {schedule.interval_num} ({schedule.interval_num} days)</p>
                    </div>
                  </div>
                </div>
                
                <Link
                  href={`/review?topic=${schedule.topic_id}&schedule=${schedule.id}`}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-primary-light/20 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                >
                  <Sparkles size={14} /> Review Topic Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text">Your Topics</h3>
          {topics.length > 0 && (
            <Link href="/topics/new" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-16 rounded-[var(--radius-xl)] bg-surface shadow-sm">
            <p className="text-5xl mb-4">📚</p>
            <h3 className="text-xl font-bold text-text mb-2">No topics yet</h3>
            <p className="text-text-muted text-sm mb-6">Add your first topic to get started with spaced repetition learning!</p>
            <Link
              href="/topics/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-full)] bg-primary text-white text-sm font-bold hover:shadow-glow transition-all"
            >
              <Plus size={16} />
              Add Your First Topic
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic: any) => (
              <Link
                key={topic.id}
                href={`/topics/${topic.id}`}
                className="group relative rounded-[var(--radius-lg)] bg-surface p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[var(--radius-lg)]"
                  style={{ backgroundColor: topic.color }}
                />

                <div className="flex items-start justify-between ml-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${topic.color}15` }}
                    >
                      {topic.emoji}
                    </div>
                    <div>
                      <h4 className="font-semibold text-text text-sm">{topic.title}</h4>
                      <p className="text-text-light text-xs mt-0.5">{topic.card_count} cards</p>
                    </div>
                  </div>

                  <div className="relative">
                    <MasteryRing score={topic.mastery_score} size={40} strokeWidth={3} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-muted">
                      {Math.round(topic.mastery_score)}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Add Topic Card */}
            <Link
              href="/topics/new"
              className="rounded-[var(--radius-lg)] border-2 border-dashed border-border p-5 flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary hover:bg-primary-light/30 transition-all duration-200 min-h-[120px]"
            >
              <Plus size={24} />
              <span className="text-sm font-semibold">Add Topic</span>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-text mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-surface p-4 shadow-sm"
              >
                <span className="text-2xl">{activity.topic?.emoji || "📚"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text text-sm truncate">{activity.topic?.title || "Review Session"}</p>
                  <p className="text-text-light text-xs">
                    {new Date(activity.completed_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1 text-text-muted">
                    <BookOpen size={12} />
                    {activity.cards_reviewed}
                  </div>
                  <div className="flex items-center gap-1 text-success">
                    <Target size={12} />
                    {activity.cards_reviewed > 0
                      ? Math.round((activity.cards_correct / activity.cards_reviewed) * 100)
                      : 0}%
                  </div>
                  <span className="px-2 py-1 rounded-[var(--radius-full)] bg-secondary-light text-secondary font-bold text-xs">
                    +{activity.xp_earned} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
