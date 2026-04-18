"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { BarChart3, Calendar, TrendingUp, Zap, BookOpen, Loader2, Sparkles } from "lucide-react";

async function fetchProgress() {
  const res = await fetch("/api/progress");
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

const heatmapColors = {
  0: "bg-surface-2",
  1: "bg-primary-light",
  2: "bg-[#C4B5FD]",
  3: "bg-[#8B5CF6]",
  4: "bg-primary",
};

export default function ProgressPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-shimmer rounded-[var(--radius-xl)]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-shimmer rounded-[var(--radius-lg)]" />
          ))}
        </div>
        <div className="h-64 animate-shimmer rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="text-center py-20">
        <p className="text-error">Failed to load progress data.</p>
      </div>
    );
  }

  const {
    totalSessions,
    totalCardsLearned,
    retentionRate,
    bestStreak,
    heatmapData,
    weeklyData
  } = data.data;

  const maxCards = Math.max(...weeklyData.map((d: any) => d.cards), 1);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Progress 📊</h1>
        <p className="text-text-muted mt-1">Your learning journey at a glance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Cards Learned", value: totalCardsLearned, icon: BookOpen, color: "#6C47FF" },
          { label: "Total Sessions", value: totalSessions, icon: BarChart3, color: "#FF6B35" },
          { label: "Retention Rate", value: `${retentionRate}%`, icon: TrendingUp, color: "#00C896" },
          { label: "Best Streak", value: `${bestStreak} days`, icon: Zap, color: "#FFB800" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[var(--radius-lg)] bg-surface p-5 shadow-sm hover:-translate-y-1 transition-transform">
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-3"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-extrabold text-text">{stat.value}</p>
            <p className="text-text-muted text-xs font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Heatmap */}
        <div className="rounded-[var(--radius-xl)] bg-surface p-6 shadow-sm lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Review Activity
            </h3>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "w-3 h-3 rounded-[2px]",
                    heatmapColors[level as keyof typeof heatmapColors]
                  )}
                />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex gap-[3px] min-w-[700px]">
              {Array.from({ length: 52 }, (_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const dataIndex = weekIndex * 7 + dayIndex;
                    const day = heatmapData[dataIndex];
                    if (!day) return <div key={`empty-${dayIndex}`} className="w-3 h-3" />;

                    return (
                      <div
                        key={`${day.date}-${dayIndex}`}
                        className={cn(
                          "w-3 h-3 rounded-[2px] transition-colors",
                          heatmapColors[day.level as keyof typeof heatmapColors]
                        )}
                        title={`${day.date}: ${day.count} cards`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="rounded-[var(--radius-xl)] bg-surface p-6 shadow-sm">
          <h3 className="font-bold text-text mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-secondary" />
            This Week
          </h3>
          <div className="flex items-end gap-3 h-40">
            {weeklyData.map((day: any) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-text-muted">{day.cards}</span>
                <div
                  className="w-full rounded-t-[var(--radius-md)] bg-gradient-to-t from-primary to-[#8B5CF6] transition-all duration-500"
                  style={{
                    height: `${(day.cards / maxCards) * 100}%`,
                    minHeight: "4px",
                  }}
                />
                <span className="text-[10px] font-medium text-text-light">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Forgetting Curve */}
        <div className="rounded-[var(--radius-xl)] bg-surface p-6 shadow-sm flex flex-col justify-center">
          <h3 className="font-bold text-text mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-success" />
            Forgetting Curve impact
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-text-muted font-medium">Without SmartLearner</span>
                <span className="text-error font-bold">~30% retention</span>
              </div>
              <div className="w-full bg-surface-2 rounded-[var(--radius-full)] h-3 overflow-hidden shadow-inner">
                <div className="h-full rounded-[var(--radius-full)] bg-gradient-to-r from-error to-[#FF8A80] w-[30%]" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-text-muted font-medium">With SmartLearner</span>
                <span className="text-success font-bold">~{Math.max(retentionRate, 85)}% retention</span>
              </div>
              <div className="w-full bg-surface-2 rounded-[var(--radius-full)] h-3 overflow-hidden shadow-inner flex relative">
                <div className="h-full rounded-[var(--radius-full)] bg-gradient-to-r from-success to-[#4ADE80]" style={{ width: `${Math.max(retentionRate, 85)}%` }} />
                <Sparkles size={12} className="absolute right-2 top-0.5 text-white opacity-80 animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-text-light text-xs mt-6 text-center italic bg-surface-2 p-2 rounded-[var(--radius-md)]">
            "Spaced repetition increases long-term retention by interrupting the forgetting curve."
          </p>
        </div>
      </div>
    </div>
  );
}
