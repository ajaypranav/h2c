/**
 * XP & Level System
 *
 * Levels follow a progressive curve — each level requires more XP.
 * XP is earned through review sessions based on rating quality.
 */

export const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  900,   // Level 5
  1400,  // Level 6
  2100,  // Level 7
  3000,  // Level 8
  4200,  // Level 9
  5800,  // Level 10
  8000,  // Level 11
  11000, // Level 12
  15000, // Level 13
  20000, // Level 14
  27000, // Level 15
];

/**
 * Calculate user's level from total XP
 */
export function getLevelFromXP(xpTotal: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xpTotal >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP required for the next level
 */
export function getXPForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) {
    // Beyond defined levels: exponential growth
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length + 1) * 10000;
  }
  return LEVEL_THRESHOLDS[level]; // level is 1-indexed, so THRESHOLDS[level] = next level threshold
}

/**
 * Get XP required for the current level
 */
export function getXPForCurrentLevel(level: number): number {
  if (level <= 1) return 0;
  return LEVEL_THRESHOLDS[level - 1];
}

/**
 * Calculate progress percentage to next level
 */
export function getLevelProgress(xpTotal: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number; // 0-100
} {
  const level = getLevelFromXP(xpTotal);
  const currentLevelXP = getXPForCurrentLevel(level);
  const nextLevelXP = getXPForNextLevel(level);

  const xpInLevel = xpTotal - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progress = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;

  return { level, currentLevelXP, nextLevelXP, progress };
}

/**
 * Get level tier for coloring
 * 1-5: Purple (beginner)
 * 6-10: Gold (intermediate)
 * 11+: Diamond (advanced)
 */
export function getLevelTier(level: number): "purple" | "gold" | "diamond" {
  if (level <= 5) return "purple";
  if (level <= 10) return "gold";
  return "diamond";
}

/**
 * Level tier colors
 */
export const LEVEL_COLORS = {
  purple: { bg: "#EDE9FF", text: "#6C47FF", icon: "👑" },
  gold: { bg: "#FFF8E6", text: "#D4A017", icon: "👑" },
  diamond: { bg: "#E6FBFF", text: "#0EA5E9", icon: "💎" },
} as const;
