// ============================================================
// SmartLearner — Shared TypeScript Types
// ============================================================

// --- User ---
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  xp_total: number;
  level: number;
  streak_count: number;
  longest_streak: number;
  last_activity_date: string | null;
  timezone: string;
  learning_goal: string | null;
  created_at: string;
  updated_at: string;
}

// --- Topic ---
export type TopicStatus = "active" | "paused" | "mastered";

export interface Topic {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  raw_notes: string | null;
  status: TopicStatus;
  card_count: number;
  mastery_score: number;
  color: string;
  emoji: string;
  created_at: string;
  updated_at: string;
}

// --- Review Card ---
export type CardType = "basic" | "cloze" | "mcq";

export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

export interface ReviewCard {
  id: string;
  topic_id: string;
  user_id: string;
  front: string;
  back: string;
  card_type: CardType;
  mcq_options: MCQOption[] | null;
  hint: string | null;
  tags: string[];
  ai_generated: boolean;
  // SM-2 fields
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  // Stats
  times_correct: number;
  times_incorrect: number;
  created_at: string;
}

// --- Review Session ---
export type SessionType = "scheduled" | "manual" | "onboarding";

export interface ReviewSession {
  id: string;
  user_id: string;
  topic_id: string | null;
  session_type: SessionType;
  started_at: string;
  completed_at: string | null;
  cards_reviewed: number;
  cards_correct: number;
  xp_earned: number;
  duration_secs: number | null;
}

// --- Review Result ---
export interface ReviewResult {
  id: string;
  session_id: string;
  card_id: string;
  user_id: string;
  rating: number; // 0-5 SM-2 scale
  response_time_ms: number | null;
  new_interval: number;
  new_ease_factor: number;
  reviewed_at: string;
}

// --- Achievement / Badge ---
export interface Achievement {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  criteria: string;
  checkFn?: (stats: UserStats) => boolean;
}

// --- Notification ---
export type NotificationType = "review_reminder" | "streak_warning" | "achievement";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  sent_at: string | null;
  created_at: string;
}

// --- Dashboard ---
export interface DashboardData {
  dueCount: number;
  streak: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  xpForCurrentLevel: number;
  recentActivity: RecentActivityItem[];
  topicSummaries: TopicSummary[];
}

export interface RecentActivityItem {
  id: string;
  date: string;
  topicTitle: string;
  topicEmoji: string;
  cardsReviewed: number;
  accuracy: number;
  xpEarned: number;
}

export interface TopicSummary {
  id: string;
  title: string;
  emoji: string;
  color: string;
  mastery_score: number;
  card_count: number;
  due_count: number;
  next_review: string | null;
}

// --- Progress ---
export interface ProgressData {
  heatmapData: HeatmapDay[];
  weeklyStats: WeeklyDay[];
  topicBreakdown: TopicBreakdownItem[];
  retentionRate: number;
  totalCardsLearned: number;
  totalSessions: number;
  bestStreak: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface WeeklyDay {
  day: string;
  cards: number;
}

export interface TopicBreakdownItem {
  id: string;
  title: string;
  emoji: string;
  cards: number;
  mastery: number;
  dueToday: number;
  trend: "up" | "down" | "stable";
}

// --- User Stats (for badge checks) ---
export interface UserStats {
  totalTopics: number;
  totalCardsReviewed: number;
  streakCount: number;
  longestStreak: number;
  level: number;
  perfectSessions: number;
  reviewHour: number;
}

// --- API Response ---
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// --- SM-2 Result ---
export interface SM2Result {
  nextInterval: number;
  nextEaseFactor: number;
  nextRepetitions: number;
}

// --- Card Submission ---
export interface CardSubmissionResult {
  xpEarned: number;
  newInterval: number;
  streakUpdated: boolean;
  badgesEarned: Badge[];
}

// --- Session Complete ---
export interface SessionCompleteResult {
  session: ReviewSession;
  totalXP: number;
  newLevel: number;
  badgesEarned: Badge[];
  streakCount: number;
  accuracy: number;
}

// --- AI Generation ---
export interface GeneratedCard {
  front: string;
  back: string;
  hint?: string;
  type: CardType;
  mcq_options?: MCQOption[];
}

// --- Color Swatches ---
export const TOPIC_COLORS = [
  "#6C47FF", // purple
  "#FF6B35", // orange
  "#00C896", // green
  "#3B82F6", // blue
  "#EC4899", // pink
  "#EF4444", // red
  "#F59E0B", // yellow
  "#14B8A6", // teal
] as const;

// --- Emoji Options ---
export const TOPIC_EMOJIS = [
  "📚", "🧠", "💡", "🔬", "📐", "🎨", "🎵", "💻",
  "🌍", "📝", "🔢", "🧪", "📖", "🎯", "⚡", "🚀",
  "🏗️", "🔧", "📊", "🎓",
] as const;
