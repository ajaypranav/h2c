"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { BADGES, getBadgeProgressHint } from "@/lib/badges";
import { Lock } from "lucide-react";

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
        <div>
          <div className="h-10 w-48 animate-shimmer rounded-[var(--radius-sm)] mb-2" />
          <div className="h-4 w-32 animate-shimmer rounded-[var(--radius-sm)]" />
        </div>
        <div>
          <div className="h-6 w-24 animate-shimmer rounded-[var(--radius-sm)] mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-shimmer rounded-[var(--radius-lg)]" />
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
  const earnedBadgeIds = achievements.map((a: any) => a.badge_id);

  const earnedBadges = BADGES.filter((b) => earnedBadgeIds.includes(b.id));
  const lockedBadges = BADGES.filter((b) => !earnedBadgeIds.includes(b.id));

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Achievements 🏆</h1>
        <p className="text-text-muted mt-1">
          {earnedBadges.length} of {BADGES.length} badges earned
        </p>
      </div>

      {/* Earned Section - Only show if there are earned badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
            ✅ Earned
            <span className="px-2 py-0.5 rounded-[var(--radius-full)] bg-success-light text-success text-xs font-bold">
              {earnedBadges.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-success to-[#4ADE80] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <div className="text-4xl mb-3">{badge.icon}</div>
                <h3 className="font-bold text-text">{badge.name}</h3>
                <p className="text-text-muted text-sm mt-1">{badge.description}</p>
                <p className="text-success text-xs font-semibold mt-3 flex items-center gap-1">
                  🎉 Earned
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Section */}
      <div>
        <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
          🔒 Locked
          <span className="px-2 py-0.5 rounded-[var(--radius-full)] bg-surface-2 text-text-muted text-xs font-bold">
            {lockedBadges.length}
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lockedBadges.map((badge) => {
            const progressHint = getBadgeProgressHint(badge, userStats);
            return (
              <div
                key={badge.id}
                className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-sm relative overflow-hidden opacity-70 hover:opacity-100 transition-opacity"
              >
                <div className="absolute top-3 right-3">
                  <Lock size={16} className="text-text-light" />
                </div>
                <div className="text-4xl mb-3 grayscale opacity-60 mix-blend-luminosity">{badge.icon}</div>
                <h3 className="font-bold text-text">{badge.name}</h3>
                <p className="text-text-muted text-sm mt-1">{badge.description}</p>
                <div className="mt-3 flex flex-col gap-1.5">
                  <p className="text-text-light text-xs font-medium">
                    {badge.criteria}
                  </p>
                  {progressHint && (
                    <div className="bg-surface-2 rounded-[var(--radius-sm)] px-2 py-1 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      <p className="text-xs text-secondary font-semibold">
                        {progressHint}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
