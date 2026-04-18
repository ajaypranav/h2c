import type { Badge, UserStats } from "@/types";

/**
 * All 13 badges available in SmartLearner
 */
export const BADGES: Badge[] = [
  {
    id: "first_topic",
    name: "First Step",
    icon: "📚",
    description: "Log your first topic",
    criteria: "Log first topic",
    checkFn: (stats) => stats.totalTopics >= 1,
  },
  {
    id: "first_review",
    name: "Reviewer",
    icon: "🔍",
    description: "Complete your first review session",
    criteria: "Complete first session",
    checkFn: (stats) => stats.totalCardsReviewed >= 1,
  },
  {
    id: "streak_3",
    name: "On Fire",
    icon: "🔥",
    description: "Maintain a 3-day streak",
    criteria: "3-day streak",
    checkFn: (stats) => stats.streakCount >= 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    icon: "⚡",
    description: "Maintain a 7-day streak",
    criteria: "7-day streak",
    checkFn: (stats) => stats.streakCount >= 7,
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    icon: "🏆",
    description: "Maintain a 30-day streak",
    criteria: "30-day streak",
    checkFn: (stats) => stats.streakCount >= 30,
  },
  {
    id: "cards_50",
    name: "Card Collector",
    icon: "🃏",
    description: "Review 50 cards total",
    criteria: "Review 50 cards",
    checkFn: (stats) => stats.totalCardsReviewed >= 50,
  },
  {
    id: "cards_500",
    name: "Card Master",
    icon: "👑",
    description: "Review 500 cards total",
    criteria: "Review 500 cards",
    checkFn: (stats) => stats.totalCardsReviewed >= 500,
  },
  {
    id: "perfect_session",
    name: "Perfect Score",
    icon: "⭐",
    description: "Get 100% accuracy in a review session",
    criteria: "100% session accuracy",
    checkFn: (stats) => stats.perfectSessions >= 1,
  },
  {
    id: "topics_5",
    name: "Curious Mind",
    icon: "🧠",
    description: "Add 5 different topics",
    criteria: "Add 5 topics",
    checkFn: (stats) => stats.totalTopics >= 5,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    icon: "🦉",
    description: "Complete a review after 10 PM",
    criteria: "Review after 10 PM",
    checkFn: (stats) => stats.reviewHour >= 22,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    icon: "🐦",
    description: "Complete a review before 7 AM",
    criteria: "Review before 7 AM",
    checkFn: (stats) => stats.reviewHour < 7,
  },
  {
    id: "level_5",
    name: "Scholar",
    icon: "🎓",
    description: "Reach level 5",
    criteria: "Reach level 5",
    checkFn: (stats) => stats.level >= 5,
  },
  {
    id: "level_10",
    name: "Expert",
    icon: "💎",
    description: "Reach level 10",
    criteria: "Reach level 10",
    checkFn: (stats) => stats.level >= 10,
  },
];

/**
 * Get badge by ID
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES.find((b) => b.id === badgeId);
}

/**
 * Check which badges a user has earned based on their stats
 */
export function checkNewBadges(
  stats: UserStats,
  alreadyEarned: string[]
): Badge[] {
  return BADGES.filter(
    (badge) =>
      !alreadyEarned.includes(badge.id) &&
      badge.checkFn &&
      badge.checkFn(stats)
  );
}

/**
 * Get progress hint for a locked badge
 */
export function getBadgeProgressHint(badge: Badge, stats: UserStats): string {
  switch (badge.id) {
    case "first_topic":
      return stats.totalTopics === 0 ? "Add your first topic" : "";
    case "first_review":
      return stats.totalCardsReviewed === 0 ? "Complete your first review" : "";
    case "streak_3":
      return `${Math.max(0, 3 - stats.streakCount)} more days to go`;
    case "streak_7":
      return `${Math.max(0, 7 - stats.streakCount)} more days to go`;
    case "streak_30":
      return `${Math.max(0, 30 - stats.streakCount)} more days to go`;
    case "cards_50":
      return `Review ${Math.max(0, 50 - stats.totalCardsReviewed)} more cards`;
    case "cards_500":
      return `Review ${Math.max(0, 500 - stats.totalCardsReviewed)} more cards`;
    case "perfect_session":
      return "Get 100% in a session";
    case "topics_5":
      return `Add ${Math.max(0, 5 - stats.totalTopics)} more topics`;
    case "night_owl":
      return "Review after 10 PM";
    case "early_bird":
      return "Review before 7 AM";
    case "level_5":
      return `Reach level 5 (currently ${stats.level})`;
    case "level_10":
      return `Reach level 10 (currently ${stats.level})`;
    default:
      return "";
  }
}
