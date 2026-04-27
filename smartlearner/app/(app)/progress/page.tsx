"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { BookOpen, Play, Brain, Shield, Rocket, TrendingUp, TrendingDown, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

async function fetchProgress() {
  const res = await fetch("/api/progress");
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

const heatmapColors = {
  0: "bg-[var(--color-surface-3)]",
  1: "bg-primary-light",
  2: "bg-[var(--color-primary-container)] opacity-80",
  3: "bg-primary",
  4: "bg-primary-dim",
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
        <div className="grid grid-cols-2 bg-surface p-4 lg:grid-cols-4 gap-4">
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
    weeklyData,
    topicBreakdown
  } = data.data;

  const maxCards = Math.max(...weeklyData.map((d: { cards: number, day: string }) => d.cards), 1);

  return (
    <div className="space-y-8 pb-12">
      {/* Header handled by AppShell mostly, but we can add title if we want, or rely on AppShell. Let's add a small header here like the design */}

      {/* Stats Cards Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto custom-scrollbar pb-2">
        <div className="bg-surface-3 rounded-[var(--radius-xl)] p-4 flex flex-col items-center text-center shadow-sm min-w-[140px]">
          <BookOpen className="text-primary mb-2 fill-[var(--color-primary)] opacity-20" size={24} />
          <span className="text-xl font-extrabold text-text">{totalCardsLearned}</span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">Total Cards Learned</span>
        </div>
        <div className="bg-surface-3 rounded-[var(--radius-xl)] p-4 flex flex-col items-center text-center shadow-sm min-w-[140px]">
          <Play className="text-secondary mb-2 fill-[var(--color-secondary)] opacity-20" size={24} />
          <span className="text-xl font-extrabold text-text">{totalSessions}</span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">Total Sessions</span>
        </div>
        <div className="bg-surface-3 rounded-[var(--radius-xl)] p-4 flex flex-col items-center text-center shadow-sm min-w-[140px]">
          <Brain className="text-success mb-2 fill-[var(--color-success)] opacity-20" size={24} />
          <span className="text-xl font-extrabold text-text">{retentionRate}%</span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">Retention Rate</span>
        </div>
        <div className="bg-surface-3 rounded-[var(--radius-xl)] p-4 flex flex-col items-center text-center shadow-sm min-w-[140px]">
          <Rocket className="text-error mb-2 fill-[var(--color-error)] opacity-20" size={24} />
          <span className="text-xl font-extrabold text-text">{bestStreak} Days</span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">Best Streak</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Heatmap & Weekly Chart */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Retention Heatmap */}
          <section className="bg-surface rounded-lg p-6 sm:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text">Learning Consistency</h2>
              <span className="text-sm font-semibold text-text-muted">Last 365 Days</span>
            </div>
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="inline-flex flex-col gap-1 min-w-max">
                <div className="flex gap-[3px]">
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
                              heatmapColors[day.level as keyof typeof heatmapColors] || heatmapColors[0]
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
            
            <div className="flex justify-end items-center gap-2 mt-4 text-xs font-semibold text-text-muted">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn("w-3 h-3 rounded-[2px]", heatmapColors[level as keyof typeof heatmapColors])}
                />
              ))}
              <span>More</span>
            </div>
          </section>

          {/* Weekly Bar Chart */}
          <section className="bg-surface rounded-lg p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-text mb-8">Cards Reviewed This Week</h2>
            <div className="h-64 flex items-end justify-between gap-2 md:gap-4 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 border-t border-b border-border py-[2px] opacity-30">
                <div className="w-full h-px bg-[var(--color-border)]"></div>
                <div className="w-full h-px bg-[var(--color-border)]"></div>
                <div className="w-full h-px bg-[var(--color-border)]"></div>
              </div>
              
              {weeklyData.map((day: { day: string; cards: number }) => {
                const heightPercentage = Math.max((day.cards / maxCards) * 100, 5);
                const isToday = new Date().toLocaleDateString('en-US', {weekday: 'short'}) === day.day;
                
                return (
                  <div key={day.day} className="relative z-10 w-full flex flex-col items-center gap-2 group">
                    <div 
                      className={cn(
                        "w-full max-w-[48px] rounded-t-lg transition-colors relative flex items-end justify-center",
                        isToday ? "bg-primary shadow-purple" : "bg-primary-light group-hover:bg-primary opacity-60 group-hover:opacity-100"
                      )}
                      style={{ height: `${heightPercentage}%` }}
                    >
                      {day.cards > 0 && (
                        <div className="absolute -top-8 bg-text text-white text-xs font-bold py-1 px-2 rounded-[var(--radius-full)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.cards}
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      isToday ? "text-primary font-extrabold" : "text-text-muted"
                    )}>
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* Right Column: Mastery & Forgetting Curve */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* Topic Mastery */}
          <section className="bg-surface rounded-lg p-6 flex flex-col shadow-sm border border-border/50">
            <h2 className="text-xl font-bold text-text mb-6">Topic Mastery</h2>
            
            <div className="space-y-4">
              {topicBreakdown && topicBreakdown.length > 0 ? (
                topicBreakdown.map((t: { title: string; emoji: string; color: string; mastery_score: number }) => {
                  const percent = Math.round(t.mastery_score);
                  const isHigh = percent >= 80;
                  const isLow = percent < 50;
                  const topicColor = t.color || 'var(--color-primary)';
                  
                  return (
                    <div key={t.title} className="bg-surface-2 p-4 rounded-xl flex items-center justify-between group hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center relative bg-white shrink-0">
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="opacity-20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={topicColor} strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={topicColor} strokeDasharray={`${percent}, 100`} strokeWidth="3" />
                          </svg>
                          <span className="text-xl">{t.emoji}</span>
                        </div>
                        <div className="truncate pr-2">
                          <h3 className="font-bold text-text truncate">{t.title}</h3>
                          <p className="text-xs font-semibold text-text-muted">Mastery</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-lg font-extrabold text-text" style={{ color: topicColor }}>{percent}%</span>
                        <div className="flex items-center text-xs font-bold gap-1 mt-0.5" style={{ color: topicColor }}>
                          {isHigh ? <TrendingUp size={12} /> : isLow ? <TrendingDown size={12} /> : <TrendingUp size={12} />} 
                          {isHigh ? 'High' : isLow ? 'Low' : 'Avg'}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-text-muted text-sm border border-dashed border-border rounded-xl">
                  No topics mastered yet.
                </div>
              )}
            </div>
            
            <Link href="/dashboard" className="mt-6 w-full py-3 rounded-full border-2 border-primary-light text-primary font-bold hover:bg-primary-light/50 transition-colors text-center inline-block">
              View All Topics
            </Link>
          </section>

          {/* Forgetting Curve Widget */}
          <section className="bg-surface rounded-lg p-6 flex flex-col shadow-sm border border-border/50">
            <h2 className="text-xl font-bold text-text mb-2">The Science Behind SmartLearner</h2>
            <p className="text-xs font-semibold text-text-muted mb-6">Optimized review cycles beat natural forgetting.</p>
            
            <div className="relative h-48 w-full mt-4 bg-surface">
              {/* Chart Background Grids */}
              <div className="absolute inset-0 flex flex-col justify-between border-l border-b border-border/50">
                <div className="w-full h-px bg-border/40"></div>
                <div className="w-full h-px bg-border/40"></div>
                <div className="w-full h-px bg-border/40"></div>
              </div>
              
              <svg className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 300 150">
                {/* Without SmartLearner Curve (Red Exponential Decay) */}
                <path className="forgetting-curve-path" d="M0,10 C30,80 100,140 300,145" stroke="var(--color-error)" strokeLinecap="round" strokeWidth="3" style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'draw 2s ease-out forwards' }} />
                {/* With SmartLearner Curve (Green Stepped Reinforcement) */}
                <path className="forgetting-curve-path flex items-center justify-center" d="M0,10 C30,40 50,50 60,10 L60,10 C90,40 110,50 120,10 L120,10 C160,40 180,50 200,10 L200,10 C250,30 280,40 300,45" stroke="var(--color-success)" strokeLinecap="round" strokeWidth="3" style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: 'draw 2.5s ease-out forwards' }} />
              </svg>
              
              {/* Axis Labels */}
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold text-text-muted uppercase tracking-tighter">Retention %</div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-text-muted uppercase tracking-tighter">Time (Days)</div>
              
              {/* Legend */}
              <div className="absolute top-0 right-0 flex flex-col gap-1.5 p-2 bg-white/80 rounded-md shadow-sm border border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1.5 bg-success rounded-full"></div>
                  <span className="text-[9px] font-bold text-text-muted">With SmartLearner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1.5 bg-error rounded-full"></div>
                  <span className="text-[9px] font-bold text-text-muted">Without SmartLearner</span>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pt-4 border-t border-border">
              <p className="text-[11px] leading-relaxed text-text-muted">
                Our SM-2 algorithm identifies the <strong className="text-primary font-bold">optimal moment</strong> to review, pushing information from short-term to long-term memory.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
