# SmartLearner — Implementation Plan

> **Stitch Reference:** [SmartLearner AI Study Assistant](https://stitch.withgoogle.com/projects/6923251965347210094)
> **PRD:** [smartlearner-prd.md](file:///c:/scripts/github/soulcoder/monkey_code/smartlearner/smartlearner-prd.md)

## Overview

SmartLearner is an AI-powered learning retention platform that transforms notes/topics into gamified study plans using **SM-2 spaced repetition**. The app features AI-generated flashcards (via Anthropic Claude), XP/streak/badge gamification, and a vibrant Duolingo-inspired UI.

**Stack:** Next.js 14 (App Router, TypeScript) + Tailwind CSS + shadcn/ui + Framer Motion + Supabase (Auth + PostgreSQL) + Prisma ORM + Anthropic SDK + Zustand + TanStack Query + Recharts

---

## User Review Required

> [!IMPORTANT]
> **External Service Keys Needed:** This project requires API keys for:
> - **Supabase** (Auth + PostgreSQL database) — free tier available
> - **Anthropic** (Claude AI for card generation) — requires paid API key
> - **Resend** (email notifications) — free tier, 100 emails/day
> 
> Please confirm you have (or will create) accounts for these services, or if you'd like me to stub the AI/email integrations with mock data for now.

> [!WARNING]
> **Tailwind CSS:** The PRD specifies Tailwind CSS v3 + shadcn/ui. This deviates from the default "vanilla CSS" guideline. Since the PRD explicitly requires it, I'll proceed with Tailwind. Please confirm this is acceptable.

> [!IMPORTANT]
> **Google OAuth:** The PRD includes "Continue with Google" OAuth. This requires configuring Google OAuth credentials in Supabase. Should I include this in Phase 1, or defer to later?

---

## Proposed Changes

### Phase 1 — Foundation (Project Setup, Auth, Layout)

#### [NEW] Project Initialization
- `npx create-next-app@latest ./` with TypeScript, Tailwind, App Router, ESLint
- Install core dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `prisma`, `@prisma/client`, `framer-motion`, `zustand`, `@tanstack/react-query`, `react-hook-form`, `zod`, `clsx`, `tailwind-merge`, `lucide-react`, `recharts`, `react-hot-toast`, `canvas-confetti`
- Initialize shadcn/ui: `npx shadcn-ui@latest init`
- Setup `tailwind.config.ts` with custom design tokens from PRD

#### [NEW] Design System & Global Styles
- **`styles/globals.css`** — CSS variables for all design tokens (colors, typography, shadows, radii, spacing)
- **`tailwind.config.ts`** — Extended theme with PRD color palette (#6C47FF primary, #FF6B35 secondary, #00C896 success, etc.), Plus Jakarta Sans font, custom shadows, border radii
- **`lib/cn.ts`** — `clsx` + `tailwind-merge` utility

#### [NEW] Database Schema
- **`prisma/schema.prisma`** — All 6 tables: `users`, `topics`, `review_cards`, `review_sessions`, `review_results`, `achievements`, `notifications`
- Run `prisma generate` + `prisma db push`

#### [NEW] Supabase Auth Integration
- **`lib/supabase/client.ts`** — Browser Supabase client
- **`lib/supabase/server.ts`** — Server-side Supabase client
- **`middleware.ts`** — Auth middleware for protected routes

#### [NEW] Layout Components
- **`components/layout/AppShell.tsx`** — Main layout wrapper
- **`components/layout/Sidebar.tsx`** — Desktop sidebar (collapsible, icons + labels)
- **`components/layout/BottomNav.tsx`** — Mobile bottom tab bar (Home, Topics, Review, Profile)

#### [NEW] Auth Page
- **`app/(auth)/auth/page.tsx`** — Sign Up / Sign In with tab toggle, email form, Google OAuth, error states, loading spinners
- Split layout: left brand panel + right form panel

#### [NEW] Core Types
- **`types/index.ts`** — All shared TypeScript interfaces: `User`, `Topic`, `ReviewCard`, `ReviewSession`, `ReviewResult`, `Achievement`, `Badge`

**Milestone:** Can sign up, log in, see empty dashboard shell

---

### Phase 2 — Topics + AI Card Generation

#### [NEW] Topic Form
- **`app/(app)/topics/new/page.tsx`** — Topic creation form
- **`components/topics/TopicForm.tsx`** — Title, emoji picker, color swatches, notes textarea, character count, generate button with rotating loading messages

#### [NEW] AI Integration
- **`lib/ai.ts`** — Anthropic API wrapper for card generation
- **`app/api/ai/generate-cards/route.ts`** — Server-side AI endpoint
- **`app/api/ai/explain-card/route.ts`** — Card explanation endpoint

#### [NEW] Topics API
- **`app/api/topics/route.ts`** — `GET` (list) + `POST` (create + trigger AI)
- **`app/api/topics/[id]/route.ts`** — `GET`, `PATCH`, `DELETE`
- **`app/api/topics/[id]/cards/route.ts`** — Card CRUD

#### [NEW] SM-2 Algorithm
- **`lib/sm2.ts`** — Pure TypeScript SM-2 implementation (as specified in PRD)

#### [NEW] Topic Detail Page
- **`app/(app)/topics/[id]/page.tsx`** — Topic header, stats row, card grid
- **`components/topics/CardList.tsx`** — Flip card grid with edit/delete
- **`components/shared/MasteryRing.tsx`** — SVG circular progress indicator

#### [NEW] Validation Schemas
- **`lib/validations/topic.ts`** — Zod schemas for topic create/update
- **`lib/validations/review.ts`** — Zod schemas for review submissions

**Milestone:** Log a topic, see AI-generated cards

---

### Phase 3 — Review Session Engine

#### [NEW] Review Queue API
- **`app/api/reviews/queue/route.ts`** — Get today's due cards
- **`app/api/reviews/session/start/route.ts`** — Create new review session
- **`app/api/reviews/session/[id]/submit-card/route.ts`** — Submit card rating + SM-2 calc
- **`app/api/reviews/session/[id]/complete/route.ts`** — Complete session + awards

#### [NEW] Review Session Page
- **`app/(app)/review/page.tsx`** — Full-screen immersive review mode
- **`components/review/FlipCard.tsx`** — 3D CSS flip card with perspective, Framer Motion animation
- **`components/review/RatingButtons.tsx`** — 4 rating buttons (Forgot/Hard/Good/Easy) with slide-up animation
- **`components/review/SessionProgress.tsx`** — Top progress bar + card counter
- **`components/review/SessionComplete.tsx`** — Confetti, stats summary, badge reveals

#### [NEW] State Management
- **`stores/session.store.ts`** — Zustand store for review session state
- **`stores/xp.store.ts`** — XP animation queue store

**Milestone:** Complete a full review session with SM-2 scheduling

---

### Phase 4 — Gamification System

#### [NEW] XP & Leveling
- **`lib/xp.ts`** — XP calculation functions + level thresholds (100, 250, 500, 900, 1400...)
- **`components/shared/XPBadge.tsx`** — Level pill with crown icon

#### [NEW] Streak Tracking
- **`components/shared/StreakBadge.tsx`** — Fire emoji + streak count with animated flicker

#### [NEW] Badge System  
- **`lib/badges.ts`** — All 13 badge definitions + check functions (first_topic, first_review, streak_3/7/30, cards_50/500, perfect_session, topics_5, night_owl, early_bird, level_5/10)
- **`components/shared/BadgeCard.tsx`** — Earned (full color) + Locked (greyscale + lock)

#### [NEW] Achievements Page
- **`app/(app)/achievements/page.tsx`** — Badge grid (earned + locked sections)
- **`app/api/achievements/route.ts`** — List earned + locked badges

**Milestone:** Full gamification loop operational

---

### Phase 5 — Dashboard & Progress

#### [NEW] Dashboard
- **`app/(app)/dashboard/page.tsx`** — Main dashboard with all widgets
- **`components/dashboard/DailyReviewCard.tsx`** — Hero card with due count, progress ring, CTA
- **`components/dashboard/StreakWidget.tsx`** — Streak display with fire animation
- **`components/dashboard/TopicGrid.tsx`** — Topic cards grid (2-col mobile, 3-col desktop)
- **`components/dashboard/RecentActivity.tsx`** — Last 5 review sessions feed
- **`app/api/dashboard/route.ts`** — Aggregated dashboard data

#### [NEW] Progress Page
- **`app/(app)/progress/page.tsx`** — Deep stats dashboard
- **`components/progress/RetentionHeatmap.tsx`** — GitHub-style 365-day heatmap
- **`components/progress/WeeklyChart.tsx`** — Recharts bar chart
- **`app/api/progress/route.ts`** — Full stats data

#### [NEW] Onboarding Wizard
- **`app/(app)/onboarding/page.tsx`** — 3-step wizard (Welcome → Goal → First Topic)

#### [NEW] Shared Components
- **`components/shared/EmptyState.tsx`** — Illustration + text + CTA
- **`components/shared/Skeleton.tsx`** — Shimmer loading placeholders
- **`components/shared/ProgressBar.tsx`** — Animated gradient bar

**Milestone:** Full dashboard + progress visibility

---

### Phase 6 — Settings, Landing, Polish

#### [NEW] Landing Page
- **`app/(marketing)/page.tsx`** — Full marketing page: hero, feature cards, how it works, social proof, final CTA, footer

#### [NEW] Settings Page
- **`app/(app)/settings/page.tsx`** — Profile, notifications, study preferences, account management

#### [NEW] Email Notifications
- **`lib/email.ts`** — Resend SDK wrapper
- **`app/api/cron/send-review-reminders/route.ts`** — Cron endpoint for daily reminders

#### [NEW] TanStack Query Hooks
- **`hooks/useTopics.ts`**, **`hooks/useDashboard.ts`**, **`hooks/useReviewQueue.ts`**, **`hooks/useProgress.ts`**

#### Auth Store
- **`stores/auth.store.ts`** — Zustand auth store

---

## Verification Plan

### Automated Tests
- SM-2 algorithm unit tests (`lib/sm2.test.ts`)
- `npm run build` — ensure no TypeScript/build errors
- `npm run lint` — ensure code quality
- Manual browser testing of all 10 screens

### Manual Verification
- Full user flow: Sign up → Onboarding → Add Topic → AI generates cards → Review session → See XP/streak/badge updates → Dashboard stats → Progress page
- Mobile responsiveness check on all screens
- Review session flip card animation performance (target: 60fps)

---

## Open Questions

> [!IMPORTANT]
> 1. Do you have Supabase/Anthropic/Resend API keys ready, or should I build with mock data initially?
> 2. Should I start with Phase 1 immediately after approval?
> 3. Any preference for the Anthropic model? PRD suggests `claude-sonnet-4-20250514`.
