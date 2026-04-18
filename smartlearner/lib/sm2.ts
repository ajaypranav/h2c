import type { SM2Result } from "@/types";

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Rating scale:
 *   0 = complete blackout
 *   1 = incorrect, but remembered upon seeing answer
 *   2 = incorrect, but answer seemed easy to recall
 *   3 = correct answer, but with serious difficulty
 *   4 = correct answer, after a hesitation
 *   5 = perfect response
 *
 * @param rating       - User's self-assessment (0-5)
 * @param repetitions  - Number of times the card has been successfully reviewed
 * @param easeFactor   - Easiness factor (starts at 2.5, min 1.3)
 * @param interval     - Current interval in days
 * @returns            - Next interval, ease factor, and repetition count
 */
export function calculateSM2(
  rating: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): SM2Result {
  // Calculate new ease factor
  let nextEaseFactor =
    easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));

  // Enforce minimum ease factor of 1.3
  if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

  let nextRepetitions = repetitions;
  let nextInterval: number;

  if (rating < 3) {
    // Failed — reset to beginning
    nextRepetitions = 0;
    nextInterval = 1;
  } else {
    // Passed — advance
    nextRepetitions = repetitions + 1;

    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * nextEaseFactor);
    }
  }

  return {
    nextInterval,
    nextEaseFactor: Math.round(nextEaseFactor * 100) / 100,
    nextRepetitions,
  };
}

/**
 * Calculate XP earned for a given rating
 */
export function calculateXP(rating: number): number {
  if (rating >= 5) return 20;
  if (rating >= 4) return 15;
  if (rating >= 3) return 10;
  return 5; // Still get some XP for trying
}

/**
 * Get the next review date based on interval
 */
export function getNextReviewDate(intervalDays: number): Date {
  const now = new Date();
  now.setDate(now.getDate() + intervalDays);
  return now;
}
