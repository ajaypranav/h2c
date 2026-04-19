# SmartLearner — Implementation Task List

> **Single source of truth** for all implementation work.
> **Design reference:** `design-reference/*.html` (11 Stitch screen exports)
> **PRD:** `smartlearner-prd.md`
> **Stitch project:** [stitch.withgoogle.com/projects/6923251965347210094](https://stitch.withgoogle.com/projects/6923251965347210094)

---

## Phase 1 — Foundation ✅ COMPLETE

### 1.1 Project Setup
- [x] Initialize Next.js 14 App Router with TypeScript
- [x] Configure Tailwind CSS v3 + design tokens (`globals.css`)
- [x] Install core dependencies: `@tanstack/react-query`, `zustand`, `framer-motion`, `react-hot-toast`, `canvas-confetti`, `lucide-react`
- [x] Set up Prisma ORM with PostgreSQL adapter
- [x] Configure Supabase project + environment variables (`.env.local`)
- [x] Deploy to Vercel (auto-deploy from GitHub main)

### 1.2 Database Schema
- [x] Create Prisma schema with all 7 tables (`prisma/schema.prisma`)
  - [x] `users` — profile, XP, streaks, level
  - [x] `topics` — title, emoji, color, mastery score
  - [x] `review_cards` — front/back, SM-2 fields (ease, interval, reps)
  - [x] `review_sessions` — session tracking
  - [x] `review_results` — per-card rating results
  - [x] `achievements` — badge_id + earned_at
  - [x] `notifications` — type, title, body, read status
- [x] Run initial migration (`prisma/initial.sql`)
- [x] Apply Row Level Security (RLS) policies on all tables

### 1.3 Authentication
- [x] Set up Supabase Auth (email/password + Google OAuth)
- [x] Create Supabase browser client (`lib/supabase/client.ts`)
- [x] Create Supabase server client (`lib/supabase/server.ts`)
- [x] Build Auth middleware (`middleware.ts`)
- [x] Build `AuthForm.tsx` component (`components/auth/AuthForm.tsx`)
- [x] Create auth page (`app/(auth)/auth/page.tsx`)
  - **Design ref:** `design-reference/02-auth-page.html`
  - [x] Sign In form with email + password
  - [x] Forgot password link
  - [ ] **TODO:** Sign Up / Sign In tab toggle (per updated Stitch design)
  - [ ] **TODO:** Sign Up form (display name + email + password)
  - [ ] **TODO:** Google OAuth button ("Continue with Google")
  - [ ] **TODO:** "or" divider between OAuth and email form

### 1.4 App Shell & Navigation
- [x] Build `AppShell.tsx` layout wrapper (`components/layout/AppShell.tsx`)
- [x] Build `Sidebar.tsx` for desktop navigation (`components/layout/Sidebar.tsx`)
- [x] Build `BottomNav.tsx` for mobile navigation (`components/layout/BottomNav.tsx`)
- [x] Create app layout with sidebar/bottom nav (`app/(app)/layout.tsx`)

### 1.5 Core Library
- [x] SM-2 spaced repetition algorithm (`lib/sm2.ts`)
- [x] XP calculation + level thresholds (`lib/xp.ts`)
- [x] Badge definitions + check functions (`lib/badges.ts`)
- [x] Zod validation schemas (`lib/validations/`)
- [x] Utility: `cn()` classname merger (`lib/cn.ts`)
- [x] Prisma client singleton (`lib/prisma.ts`)

### 1.6 State Management
- [x] Auth store — `useAuthStore` (`stores/auth.store.ts`)
- [x] Review session store — `useSessionStore` (`stores/session.store.ts`)
- [x] XP animation store — `useXPStore` (`stores/xp.store.ts`)
- [x] TanStack Query provider (`components/Providers.tsx`)

### 1.7 Base UI Components
- [x] `Button` component (`components/ui/button.tsx`)
- [x] `Input` component (`components/ui/input.tsx`)
- [x] `Label` component (`components/ui/label.tsx`)

---

## Phase 2 — Landing Page & Onboarding ✅ COMPLETE

### 2.1 Landing Page (`/`)
- **Design ref:** `design-reference/01-landing-page.html`
- [x] Navbar — Logo + "Sign In" + "Get Started" buttons
- [x] Hero section — Animated headline, gradient text, CTA, "No credit card" trust text
- [x] Feature cards (3-col) — AI Cards, Science Scheduling, Gamified Progress
- [x] How It Works (3 steps) — Log Topic → AI Cards → Review & Remember
- [x] Social proof — Star ratings + checkmark benefits
- [x] Final CTA — Purple gradient banner with "Start Learning" button
- [x] Footer — Logo, Privacy, Terms, GitHub links

### 2.2 Onboarding Wizard (`/onboarding`)
- **Design ref:** `design-reference/03-onboarding-wizard.html`
- [x] Step indicator (3 numbered circles) + progress bar
- [x] Step 1 — Welcome: Display name, avatar emoji picker (12 options), timezone select
- [x] Step 2 — Choose Goal: Radio cards (Exams, Skill, Professional, Curiosity)
- [x] Step 3 — First Topic: Title input, emoji picker, color swatches (8), notes textarea, card count hint
- [x] "Skip for now" links on Steps 1 & 2
- [x] "Generate Study Plan" CTA on Step 3 with loading state
- [x] Auth sync API call on completion
- [x] Confetti animation + toast on success
- [x] Redirect to `/dashboard`

---

## Phase 3 — Core Features (Topics + Review) ✅ MOSTLY COMPLETE

### 3.1 Topics API
- [x] `GET /api/topics` — List user topics with card counts + mastery
- [x] `POST /api/topics` — Create topic (triggers AI card generation)
- [x] `GET /api/topics/:id` — Single topic detail
- [x] `PATCH /api/topics/:id` — Update topic
- [x] `DELETE /api/topics/:id` — Delete topic + cascade

### 3.2 Add/Edit Topic Page (`/topics/new`, `/topics/:id/edit`)
- **Design ref:** `design-reference/05-add-topic.html`
- [x] Topic form — title, emoji picker, color swatches, notes textarea
- [x] Card count hint (10-15 based on notes length)
- [ ] **TODO:** Loading animation with rotating messages ("Reading your notes...", "Creating review cards...", "Building your schedule...")
- [ ] **TODO:** Success state — slide-in card preview showing sample cards + "Start Now" / "View All Cards" buttons

### 3.3 Topic Detail Page (`/topics/:id`)
- **Design ref:** `design-reference/06-topic-detail.html`
- [x] Topic header with emoji + title + description
- [ ] **TODO:** Mastery score circular progress ring (0-100%)
- [ ] **TODO:** Stats row — 4 pill badges (Total Cards, Mastered, Due Today, Avg Ease)
- [ ] **TODO:** Edit pencil and Delete trash buttons in header
- [ ] **TODO:** Retention chart (line chart, last 14 sessions)
- [ ] **TODO:** "Last reviewed X days ago" text
- [x] Card list with flip-card display
- [ ] **TODO:** Edit/Delete icon buttons on each card
- [ ] **TODO:** "+ Add Card" button at bottom
- [ ] **TODO:** "Review Now" floating action button (bottom-right, purple gradient)

### 3.4 Review Session APIs
- [x] `GET /api/reviews/queue` — Today's due cards (max 20, sorted overdue-first)
- [x] `POST /api/reviews/session/start` — Create session, return shuffled queue
- [x] `POST /api/reviews/session/:id/submit-card` — SM-2 calc, update card, save result, award XP
- [x] `POST /api/reviews/session/:id/complete` — Finalize session, streak update, badge checks

### 3.5 Review Session Page (`/review`)
- **Design ref:** `design-reference/07-review-session.html`
- [x] Immersive full-screen layout (no sidebar/bottom nav)
- [x] Exit button (x) top-left with link to dashboard
- [x] Card counter ("Card 3 of 12")
- [x] Progress bar — gradient (purple to green), animated width
- [x] Session XP tracker (top-right) with fire streak icon
- [x] Flip card — CSS 3D animation (600ms), front=question, back=answer
- [x] "Show Answer" button (purple pill, visible when front-facing)
- [x] Hint button (bulb "Show hint" toggle)
- [x] Rating buttons (4): Forgot, Hard, Good, Easy — slide-up animation
- [x] XP popup animation (+XP floating text)
- [x] Keyboard shortcuts: Space=flip, 1/2/3/4=ratings
- [x] Empty state ("All caught up!")

### 3.6 Session Complete Screen
- **Design ref:** `design-reference/08-session-complete.html`
- [x] Confetti animation (canvas-confetti)
- [x] "Session Complete!" heading
- [x] Stats grid: Cards Reviewed, Accuracy %, XP Earned, Day Streak
- [x] "Back to Dashboard" button
- [ ] **TODO:** Badge reveals — animated badge display for newly earned badges
- [ ] **TODO:** "Review More" button
- [ ] **TODO:** Level progress indicator ("Level 12 to 13" with XP bar)

---

## Phase 4 — Dashboard & Gamification ✅ MOSTLY COMPLETE

### 4.1 Dashboard API
- [x] `GET /api/dashboard` — dueCount, streak, xp, level, recentActivity, topicSummaries

### 4.2 Dashboard Page (`/dashboard`)
- **Design ref:** `design-reference/04-dashboard.html`
- [x] Daily Review Card (hero) — "X cards due today", progress ring, est. time, "Start Review" CTA
- [x] Empty state — "All caught up!" with celebration
- [x] Streak Widget — fire flame + count + "Keep your streak alive!" text
- [x] XP & Level Bar — Crown badge, progress bar, XP to next level
- [x] Topic Cards Grid — emoji, title, mastery ring, card count, colored left border
- [x] "Add Topic" card — dashed border + plus icon
- [x] Recent Activity Feed — date, topic, cards reviewed, accuracy %, XP earned
- [x] Skeleton loading state for all sections
- [x] Empty state for no topics

### 4.3 Gamification Logic
- [x] XP award per rating: 1-2=5XP, 3=10XP, 4=15XP, 5=20XP
- [x] Streak tracking — increment if last_activity was yesterday/today, reset if missed
- [x] Level thresholds: [0, 100, 250, 500, 900, 1400, 2100, 3000, ...]
- [x] Badge check functions (13 badges defined in `lib/badges.ts`)
- [x] Badge trigger on session complete

---

## Phase 5 — Progress, Achievements, Settings ✅ COMPLETE

### 5.1 Progress API
- [x] `GET /api/progress` — heatmapData, weeklyStats, topicBreakdown, retentionRate

### 5.2 Progress Page (`/progress`)
- **Design ref:** `design-reference/09-progress-page.html`
- [x] Stats cards row — 4 metrics (Total Cards Learned, Total Sessions, Retention Rate, Best Streak)
- [x] Retention heatmap — GitHub-style 365-day calendar, colored by review intensity
- [x] Weekly activity chart — bar chart, cards reviewed per day (last 7 days)
- [x] Topic mastery list — topic name, mastery %, level indicator, trend
- [x] Forgetting Curve widget — static educational graphic ("Without vs With SmartLearner")
- [x] Navigation + bottom nav

### 5.3 Achievements API
- [x] `GET /api/achievements` — earned + locked badges list

### 5.4 Achievements Page (`/achievements`)
- **Design ref:** `design-reference/10-achievements.html`
- [x] "Trophy Room" heading + motivational copy
- [x] Earned section — full-color badge cards with name, description, earned date
- [x] Locked section — greyed-out with lock icon overlay + progress hints
- [x] All 13 PRD badges displayed:
  - [x] First Step, Reviewer, On Fire, Week Warrior, Unstoppable
  - [x] Card Collector, Card Master, Perfect Score, Curious Mind
  - [x] Night Owl, Early Bird, Scholar, Expert
- [x] 2-column grid layout for badge cards

### 5.5 Settings Page (`/settings`)
- **Design ref:** `design-reference/11-settings.html`
- [x] Profile section — display name input, avatar emoji picker, timezone dropdown, change password
- [x] Study Preferences section — session size (10/15/20 cards), difficulty (Easy/Balanced/Hard)
- [x] Notifications section — toggle daily review reminder, set preferred time, toggle streak warnings
- [x] Account section — "Export my data" (JSON download), "Delete account" (type DELETE confirmation)

---

## Phase 6 — Polish, Email & Launch — NOT STARTED

### 6.1 Auth Page Enhancement
- **Design ref:** `design-reference/02-auth-page.html`
- [ ] Add Sign Up / Sign In tab toggle UI
- [ ] Add Sign Up form (display name, email, password with validation)
- [ ] Add Google OAuth button with divider
- [ ] Loading state: spinner + "Creating account..." text
- [ ] Inline error display under fields

### 6.2 Email Notifications
- [ ] Install Resend SDK
- [ ] Welcome email on sign-up
- [ ] Daily review reminder email
- [ ] Streak warning email (about to lose streak)
- [ ] Configure Resend from email + API key

### 6.3 Cron Jobs
- [ ] `POST /api/cron/send-review-reminders` — daily at 8 AM user local time
- [ ] `vercel.json` cron configuration
- [ ] Cron secret validation

### 6.4 Topic Detail Enhancement
- **Design ref:** `design-reference/06-topic-detail.html`
- [ ] Add mastery circular progress ring
- [ ] Implement stats row (4 pills)
- [ ] Add edit/delete pencil/trash buttons
- [ ] Add "Review Now" FAB
- [ ] Wire up retention line chart (Recharts)
- [ ] Manual card add form
- [ ] Card edit/delete actions per card

### 6.5 Session Complete Enhancement
- **Design ref:** `design-reference/08-session-complete.html`
- [ ] Animated badge reveal for newly earned badges
- [ ] "Review More" button (restart queue)
- [ ] Level progress indicator bar
- [ ] Time taken display

### 6.6 Add Topic Enhancement
- **Design ref:** `design-reference/05-add-topic.html`
- [ ] Rotating loading messages during AI generation
- [ ] Success slide-in showing 3 sample card previews
- [ ] "Start Now" vs "View All Cards" option on success

### 6.7 Mobile Responsiveness Audit
- [ ] Landing page — responsive hero, stacked features on mobile
- [ ] Dashboard — 1-col topic grid on mobile, 2-col on tablet
- [ ] Review session — full-width card, larger tap targets (min 56px) on mobile
- [ ] Settings — single column layout on mobile
- [ ] Progress — single column, scrollable charts

### 6.8 Accessibility & Performance
- [ ] Focus states on all interactive elements
- [ ] ARIA labels on icons, buttons, inputs
- [ ] Contrast check (WCAG AA minimum)
- [ ] Performance: Dashboard TTI < 2s on 3G
- [ ] Card flip animation < 16ms (CSS only)
- [ ] AI generation: < 10s with loading UI
- [ ] Image optimization + next/image for any illustrations

### 6.9 Error Handling & Edge Cases
- [ ] Error boundaries for each route
- [ ] AI generation fallback (5 template cards if API fails)
- [ ] Topic limit warning at 45 topics, hard limit at 50
- [ ] Card limit per topic (100 max)
- [ ] Input sanitization (strip HTML tags from notes)
- [ ] AI prompt injection defense (XML-wrapped user content)
- [ ] Rate limiting on AI generation (10 calls/hour/user)

---

## Design Reference Files

| # | File | Screen | Route |
|---|------|--------|-------|
| 01 | `design-reference/01-landing-page.html` | Landing Page | `/` |
| 02 | `design-reference/02-auth-page.html` | Auth (Sign Up / Sign In) | `/auth` |
| 03 | `design-reference/03-onboarding-wizard.html` | Onboarding Wizard (3 steps) | `/onboarding` |
| 04 | `design-reference/04-dashboard.html` | Dashboard | `/dashboard` |
| 05 | `design-reference/05-add-topic.html` | Add/Edit Topic | `/topics/new` |
| 06 | `design-reference/06-topic-detail.html` | Topic Detail (Enhanced) | `/topics/:id` |
| 07 | `design-reference/07-review-session.html` | Immersive Review Session | `/review` |
| 08 | `design-reference/08-session-complete.html` | Session Complete | `/review` (post) |
| 09 | `design-reference/09-progress-page.html` | Progress (Enhanced) | `/progress` |
| 10 | `design-reference/10-achievements.html` | Achievements (All Badges) | `/achievements` |
| 11 | `design-reference/11-settings.html` | Settings | `/settings` |

> **Usage:** Open any HTML file in a browser to see the exact Stitch design. Implement each page to match the design pixel-for-pixel while using React components and the existing design system tokens.
