"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { BADGES, getBadgeProgressHint } from "@/lib/badges";
import { Lock, Award } from "lucide-react";

async function fetchAchievements() {
  const res = await fetch("/api/achievements");
  if (!res.ok) throw new Error("Failed to fetch achievements");
  return res.json();
}

export default function AchievementsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-16">
          <div className="h-10 w-48 animate-shimmer rounded-[var(--radius-sm)] mx-auto mb-4" />
          <div className="h-4 w-64 animate-shimmer rounded-[var(--radius-sm)] mx-auto" />
        </div>
        <div>
          <div className="h-6 w-32 animate-shimmer rounded-[var(--radius-sm)] mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-shimmer rounded-[var(--radius-lg)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="text-center py-20 text-error">
        Failed to load achievements.
      </div>
    );
  }

  const { achievements, userStats } = data.data;
  const earnedBadgeIds = achievements.map((a: { badge_id: string }) => a.badge_id);

  const earnedBadges = BADGES.filter((b) => earnedBadgeIds.includes(b.id));
  const lockedBadges = BADGES.filter((b) => !earnedBadgeIds.includes(b.id));

  // Visual gradients for earned badges (cyclic)
  const gradients = [
    "from-primary to-[var(--color-primary-container)] shadow-primary/20",
    "from-success to-[#60fcc6] shadow-success/20",
    "from-secondary to-[var(--color-secondary-container)] shadow-secondary/20",
    "from-primary to-[var(--color-secondary-container)] shadow-primary/20",
    "from-warning to-[#fbbf24] shadow-warning/20"
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <section className="mb-12 text-center mt-6">
        <h1 className="font-extrabold text-4xl md:text-5xl text-text tracking-tight mb-4 -rotate-1 inline-block">
          Trophy Room
        </h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          Behold your academic conquests. Keep the streak alive to unlock more glory.
        </p>
      </section>

      {/* Earned Glory Section */}
      {earnedBadges.length > 0 && (
        <section className="mb-16 bg-surface-2/50 rounded-[var(--radius-xl)] p-6 md:p-10 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-primary-container)]/30 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <Award className="text-primary" size={32} />
            <h2 className="font-bold text-2xl text-text">Earned Glory</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {earnedBadges.map((badge, i) => {
              const gradient = gradients[i % gradients.length];
              const rotationClasses = ["rotate-2", "-rotate-3", "rotate-1", "-rotate-1", "rotate-3"];
              const rot = rotationClasses[i % rotationClasses.length];
              
              // Find earned date if possible
              const achievement = achievements.find((a: { badge_id: string, earned_at: string }) => a.badge_id === badge.id);
              const earnedDate = achievement ? new Date(achievement.earned_at).toLocaleDateString() : "Recently";
              
              return (
                <div
                  key={badge.id}
                  className="bg-surface rounded-[var(--radius-lg)] p-6 flex flex-col items-center text-center shadow-sm hover:-translate-y-2 transition-transform duration-300 relative z-10"
                >
                  <div className={cn(
                    "w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br flex items-center justify-center mb-6 shadow-md transition-transform duration-500 hover:rotate-12",
                    gradient, rot
                  )}>
                    <span className="text-4xl">{badge.icon}</span>
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-text">{badge.name}</h3>
                  <p className="text-text-muted text-sm mb-4">{badge.description}</p>
                  <span className="text-xs font-semibold text-primary bg-primary-light px-3 py-1.5 rounded-full whitespace-nowrap mt-auto">
                    Earned {earnedDate}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Locked Section */}
      <section>
        <div className="flex items-center gap-3 mb-8 px-2 md:px-0">
          <Lock className="text-text-light" size={28} />
          <h2 className="font-bold text-2xl text-text">Awaiting Conquest</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {lockedBadges.map((badge) => {
            const progressHint = getBadgeProgressHint(badge, userStats);
            // Derive a fake percentage for UI visual purposes since actual percentages need specific metric tracking (which we partially have)
            // Let's use simple logic for the progress bar if possible.
            let percent = 0;
            if (badge.id.includes("streak")) {
              const target = parseInt(badge.id.split("_")[1]) || 1;
              percent = Math.min(100, Math.round((userStats.streakCount / target) * 100));
            } else if (badge.id.includes("cards")) {
              const target = parseInt(badge.id.split("_")[1]) || 1;
              percent = Math.min(100, Math.round((userStats.totalCardsReviewed / target) * 100));
            } else if (badge.id.includes("level")) {
              const target = parseInt(badge.id.split("_")[1]) || 1;
              percent = Math.min(100, Math.round((userStats.level / target) * 100));
            } else if (badge.id.includes("topics")) {
              const target = parseInt(badge.id.split("_")[1]) || 1;
              percent = Math.min(100, Math.round((userStats.totalTopics / target) * 100));
            }

            return (
              <div
                key={badge.id}
                className="bg-surface-2 rounded-lg p-4 md:p-6 flex flex-col items-center text-center border border-border/50 relative overflow-hidden group hover:bg-surface-3 transition-colors"
              >
                <div className="absolute inset-0 bg-surface/50 backdrop-blur-[1px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Lock className="text-text-muted" size={32} />
                </div>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-3 flex items-center justify-center mb-4 grayscale opacity-60">
                  <span className="text-3xl">{badge.icon}</span>
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-1 text-text-muted">{badge.name}</h3>
                
                <div className="w-full bg-border rounded-full h-1.5 md:h-2 mt-auto mb-2 overflow-hidden">
                  <div className="bg-text-light h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                </div>
                <p className="text-[10px] md:text-xs text-text-light font-medium min-h-[16px]">{progressHint}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
