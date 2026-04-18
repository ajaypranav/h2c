# SmartLearner — Product Requirements Document
> **Version:** 1.0 | **Prepared for:** AI Coding Agent (Claude Code / Agentic Build)
> **Stack Mode:** MATURE | **Deployment:** Production | **Device:** Responsive Web (Mobile + Desktop)

---

## 1. Project Overview

**App Name:** SmartLearner

**Tagline:** *Learn anything. Remember everything. Actually enjoy it.*

**Purpose:** SmartLearner is an AI-powered learning retention platform that transforms raw notes or topic names into structured, gamified study plans using spaced repetition science. When a user logs a new topic, the app uses Claude AI to generate review cards, then applies the SM-2 spaced repetition algorithm to schedule optimal review sessions — ensuring concepts stick in long-term memory. The entire experience is wrapped in a colorful, Duolingo-inspired gamified shell with XP, streaks, badges, and levels.

**Target Users:** Self-learners, students, professionals — anyone who wants to learn and retain knowledge faster on any subject.

**Core Value Proposition:**
- Unlike Anki: AI generates your study cards automatically — no manual work.
- Unlike Duolingo: Works for ANY subject, not just language learning.
- Unlike Readwise: You don't need pre-existing highlights — start from scratch.

**Problem Solved:** Most people forget 70% of what they learn within 24 hours (Ebbinghaus Forgetting Curve). Traditional flashcard apps are tedious to set up. This app removes the friction entirely — just log what you're learning and let the AI + algorithm handle the rest.

---

## 2. Architecture Decision

**Pattern:** Monolithic Next.js full-stack app with API Routes, deployed on Vercel.

**System Components:**
```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Edge CDN)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Next.js 14 App Router               │   │
│  │  ┌────────────┐  ┌──────────────────────────┐   │   │
│  │  │  React UI  │  │    API Routes (/api/*)    │   │   │
│  │  │  (Client)  │  │  (Server-side logic)      │   │   │
│  │  └────────────┘  └──────────┬───────────────┘   │   │
│  └─────────────────────────────┼────────────────────┘   │
└────────────────────────────────┼────────────────────────┘
                                 │
           ┌─────────────────────┼────────────────────┐
           │                     │                    │
    ┌──────▼──────┐    ┌─────────▼──────┐   ┌────────▼───────┐
    │  Supabase   │    │  Anthropic API  │   │   Resend API   │
    │ (Auth + DB) │    │ (Claude Sonnet) │   │ (Email notifs) │
    └─────────────┘    └────────────────┘   └────────────────┘
```

**Rationale:**
- Single repository = coding agents can see the full codebase at once.
- Next.js App Router handles SSR/SSG/ISR natively — no separate backend needed.
- Supabase provides PostgreSQL + Row Level Security + Auth + Realtime in one managed service.
- SM-2 spaced repetition runs as pure TypeScript logic on the server — no ML needed.
- Claude AI is called server-side only — API key never exposed to the client.

---

## 3. Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS v3 + `tailwind-merge` + `clsx`
- **Animations:** Framer Motion v11 (page transitions, card flips, XP pop-ups, streak fire effects)
- **UI Components:** shadcn/ui (base components) + custom gamified components
- **State Management:**
  - Server data: TanStack Query v5 (React Query) — all API data
  - Global UI state: Zustand — auth user, active session state, XP animations
  - Local component state: React `useState`/`useReducer`
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts (progress dashboard, retention heatmap)
- **Notifications:** react-hot-toast (in-app toasts)
- **Icons:** Lucide React + custom emoji-style SVG badge icons

### Backend
- **Runtime:** Node.js via Next.js API Routes (Edge-compatible where possible)
- **API Style:** REST (JSON) via `/api/*` routes
- **ORM:** Prisma v5 with PostgreSQL adapter
- **Spaced Repetition:** Custom SM-2 algorithm implementation in TypeScript (`/lib/sm2.ts`)
- **AI Integration:** Anthropic SDK (`@anthropic-ai/sdk`) — server-side only
- **Email:** Resend SDK for review reminders and auth emails
- **Cron Jobs:** Vercel Cron (daily review reminder emails at 8 AM user local time)
- **Validation:** Zod (shared between frontend and backend)

### Database
- **Provider:** Supabase (managed PostgreSQL)
- **ORM:** Prisma (type-safe queries, migrations)
- **Auth:** Supabase Auth (email/password + Google OAuth)

### Infrastructure
- **Hosting:** Vercel (automatic deployments from GitHub main branch)
- **Database:** Supabase (free tier → Pro as needed)
- **Email:** Resend (100 emails/day free tier)
- **Environment:** `.env.local` (dev) + Vercel environment variables (prod)
- **CI/CD:** GitHub Actions → lint + type-check + build → Vercel auto-deploy

---

## 4. Database Schema

### Table: `users` (managed by Supabase Auth, extended via profile)
```
id            UUID          PRIMARY KEY (from Supabase auth.users)
email         TEXT          NOT NULL UNIQUE
display_name  TEXT          NOT NULL
avatar_url    TEXT          NULLABLE
xp_total      INTEGER       DEFAULT 0
level         INTEGER       DEFAULT 1
streak_count  INTEGER       DEFAULT 0
longest_streak INTEGER      DEFAULT 0
last_activity_date DATE     NULLABLE
timezone      TEXT          DEFAULT 'UTC'
created_at    TIMESTAMPTZ   DEFAULT NOW()
updated_at    TIMESTAMPTZ   DEFAULT NOW()
```

### Table: `topics`
```
id            UUID          PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID          NOT NULL FK → users.id ON DELETE CASCADE
title         TEXT          NOT NULL
description   TEXT          NULLABLE
raw_notes     TEXT          NULLABLE (original notes pasted by user)
status        TEXT          DEFAULT 'active' ('active' | 'paused' | 'mastered')
card_count    INTEGER       DEFAULT 0
mastery_score FLOAT         DEFAULT 0.0 (0-100, computed)
color         TEXT          DEFAULT '#6C47FF' (user-chosen topic color)
emoji         TEXT          DEFAULT '📚'
created_at    TIMESTAMPTZ   DEFAULT NOW()
updated_at    TIMESTAMPTZ   DEFAULT NOW()

INDEX: (user_id, status)
INDEX: (user_id, created_at DESC)
```

### Table: `review_cards`
```
id            UUID          PRIMARY KEY DEFAULT gen_random_uuid()
topic_id      UUID          NOT NULL FK → topics.id ON DELETE CASCADE
user_id       UUID          NOT NULL FK → users.id ON DELETE CASCADE
front         TEXT          NOT NULL (question / concept)
back          TEXT          NOT NULL (answer / explanation)
card_type     TEXT          DEFAULT 'basic' ('basic' | 'cloze' | 'mcq')
mcq_options   JSONB         NULLABLE (for multiple-choice: [{text, isCorrect}])
hint          TEXT          NULLABLE
tags          TEXT[]        DEFAULT '{}'
ai_generated  BOOLEAN       DEFAULT true
-- SM-2 fields
ease_factor   FLOAT         DEFAULT 2.5
interval_days INTEGER       DEFAULT 1
repetitions   INTEGER       DEFAULT 0
next_review_at TIMESTAMPTZ  DEFAULT NOW()
last_reviewed_at TIMESTAMPTZ NULLABLE
-- Aggregate stats
times_correct INTEGER       DEFAULT 0
times_incorrect INTEGER     DEFAULT 0
created_at    TIMESTAMPTZ   DEFAULT NOW()

INDEX: (user_id, next_review_at) -- critical for daily review queue
INDEX: (topic_id)
```

### Table: `review_sessions`
```
id            UUID          PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID          NOT NULL FK → users.id ON DELETE CASCADE
topic_id      UUID          NULLABLE FK → topics.id (NULL = mixed session)
session_type  TEXT          DEFAULT 'scheduled' ('scheduled' | 'manual' | 'onboarding')
started_at    TIMESTAMPTZ   DEFAULT NOW()
completed_at  TIMESTAMPTZ   NULLABLE
cards_reviewed INTEGER      DEFAULT 0
cards_correct INTEGER       DEFAULT 0
xp_earned     INTEGER       DEFAULT 0
duration_secs INTEGER       NULLABLE
```

### Table: `review_results`
```
id            UUID          PRIMARY KEY DEFAULT gen_random_uuid()
session_id    UUID          NOT NULL FK → review_sessions.id ON DELETE CASCADE
card_id       UUID          NOT NULL FK → review_cards.id ON DELETE CASCADE
user_id       UUID          NOT NULL FK → users.id ON DELETE CASCADE
rating        INTEGER       NOT NULL (0-5 SM-2 rating)
response_time_ms INTEGER    NULLABLE
new_interval  INTEGER       NOT NULL (days until next review, after SM-2 calc)
new_ease_factor FLOAT       NOT NULL
reviewed_at   TIMESTAMPTZ   DEFAULT NOW()

INDEX: (user_id, reviewed_at DESC)
INDEX: (card_id, reviewed_at DESC)
```

### Table: `achievements`
```
id            UUID          PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID          NOT NULL FK → users.id ON DELETE CASCADE
badge_id      TEXT          NOT NULL (references BADGES constant in code)
earned_at     TIMESTAMPTZ   DEFAULT NOW()
UNIQUE (user_id, badge_id)
```

### Table: `notifications`
```
id            UUID          PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID          NOT NULL FK → users.id ON DELETE CASCADE
type          TEXT          NOT NULL ('review_reminder' | 'streak_warning' | 'achievement')
title         TEXT          NOT NULL
body          TEXT          NOT NULL
read          BOOLEAN       DEFAULT false
sent_at       TIMESTAMPTZ   NULLABLE
created_at    TIMESTAMPTZ   DEFAULT NOW()
```

### SM-2 Algorithm — TypeScript Implementation (`/lib/sm2.ts`)
```typescript
// Rating scale: 0=blackout, 1=wrong, 2=wrong but familiar,
//               3=correct with difficulty, 4=correct, 5=perfect
export function calculateSM2(
  rating: number,        // 0-5
  repetitions: number,   // how many times reviewed
  easeFactor: number,    // starts at 2.5
  interval: number       // current interval in days
): { nextInterval: number; nextEaseFactor: number; nextRepetitions: number } {
  let nextEaseFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

  let nextRepetitions = repetitions;
  let nextInterval: number;

  if (rating < 3) {
    // Failed — reset
    nextRepetitions = 0;
    nextInterval = 1;
  } else {
    nextRepetitions = repetitions + 1;
    if (repetitions === 0) nextInterval = 1;
    else if (repetitions === 1) nextInterval = 6;
    else nextInterval = Math.round(interval * nextEaseFactor);
  }

  return { nextInterval, nextEaseFactor, nextRepetitions };
}
```

---

## 5. API Design

All routes return `{ data, error }` shape. Auth via Supabase JWT in `Authorization: Bearer <token>` header (handled automatically by Supabase client).

### Auth (handled by Supabase Auth SDK — no custom routes needed)
Supabase client methods: `signUp`, `signInWithPassword`, `signInWithOAuth`, `resetPasswordForEmail`, `signOut`

### Topics
```
GET    /api/topics              → List user's topics with card counts + mastery
POST   /api/topics              → Create topic (triggers AI card generation)
GET    /api/topics/:id          → Single topic detail + card list
PATCH  /api/topics/:id          → Update title/description/status/color/emoji
DELETE /api/topics/:id          → Delete topic + all cards + results

POST /api/topics
Body: { title: string, description?: string, rawNotes?: string, emoji?: string, color?: string }
Response: { data: { topic: Topic, cards: ReviewCard[], generationStatus: 'complete' | 'pending' } }
```

### Review Cards
```
GET    /api/topics/:topicId/cards        → All cards for a topic
POST   /api/topics/:topicId/cards        → Manually add a card
PATCH  /api/cards/:id                    → Edit card front/back
DELETE /api/cards/:id                    → Delete single card
POST   /api/cards/:id/regenerate         → Re-generate card via AI
```

### Review Sessions (Core Loop)
```
GET  /api/reviews/queue          → Today's due cards (max 20), sorted by overdue priority
POST /api/reviews/session/start  → Create new session, return session ID
POST /api/reviews/session/:id/submit-card
  Body: { cardId, rating: 0-5, responseTimeMs }
  Response: { data: { xpEarned, newInterval, streakUpdated, badgesEarned[] } }
POST /api/reviews/session/:id/complete
  Response: { data: { session, totalXP, newLevel, badgesEarned[], streakCount } }
```

### Dashboard & Progress
```
GET /api/dashboard               → { dueCount, streak, xp, level, recentActivity, topicSummaries }
GET /api/progress                → { heatmapData (365 days), weeklyStats, topicBreakdown, retentionRate }
GET /api/achievements            → List earned + locked badges
```

### AI Generation
```
POST /api/ai/generate-cards
  Body: { topicId, title, rawNotes?, cardCount?: 10 }
  Response: { data: { cards: GeneratedCard[] } }
  Note: Server-side only. Calls Anthropic API. Returns 5-15 cards.

POST /api/ai/explain-card
  Body: { cardId, userQuestion? }
  Response: { data: { explanation: string } }
```

### Notifications
```
GET   /api/notifications         → Unread notifications list
PATCH /api/notifications/read-all → Mark all read
```

### Error Format
```json
{ "error": { "code": "TOPIC_NOT_FOUND", "message": "Topic with ID xyz not found", "status": 404 } }
```

---

## 6. Application Pages & Screens

### Screen 1: Landing Page — `/`
**Goal:** Convert visitor to sign-up.
**Layout:** Full-screen hero sections, scrollable marketing page.
**Components:**
- **Navbar:** Logo left, "Sign In" + "Get Started" buttons right. Transparent over hero, white on scroll.
- **Hero Section:** Animated headline ("Learn Anything. Remember Everything."), subheadline, large CTA button ("Start for Free"), animated mockup of the app dashboard on the right (static screenshot or Lottie animation).
- **Feature Cards:** 3-column grid — "AI Generates Your Cards", "Science-Backed Scheduling", "Gamified Progress".
- **How It Works:** 3-step horizontal flow — Log Topic → AI Creates Cards → Review & Remember.
- **Social Proof:** "Join 10,000+ learners" (placeholder until launch), star rating.
- **Final CTA:** Full-width banner with sign-up button.
- **Footer:** Links to Privacy, Terms, GitHub.
**Auth:** Not required. Redirect to `/dashboard` if already logged in.

### Screen 2: Auth Page — `/auth`
**Goal:** Sign up or sign in.
**Layout:** Split layout — left panel has app brand/illustration, right panel has form.
**Components:**
- **Tab Toggle:** "Sign Up" / "Sign In" tabs.
- **Sign Up Form:** Display name, Email, Password (min 8 chars, 1 number), "Create Account" button.
- **Sign In Form:** Email, Password, "Forgot password?" link, "Sign In" button.
- **OAuth Button:** "Continue with Google" (single OAuth provider for v1).
- **Divider:** "or" between OAuth and email form.
- **Error Display:** Inline red text under relevant fields.
**Loading state:** Button shows spinner + "Creating account..." text.
**Post-signup:** Redirect to `/onboarding`.
**Post-signin:** Redirect to `/dashboard`.

### Screen 3: Onboarding Wizard — `/onboarding`
**Goal:** Set up user profile and log first topic.
**Layout:** Centered card, step indicator at top (3 steps).
**Step 1 — Welcome:** Display name input (pre-filled from Google if OAuth), timezone select dropdown, avatar emoji picker (12 options).
**Step 2 — Choose Goal:** Radio cards with icons: "Study for Exams", "Learn a Skill", "Professional Development", "Personal Curiosity". Sets user's learning goal tag (cosmetic in v1).
**Step 3 — Log First Topic:** Topic title input, optional notes textarea with placeholder "Paste your notes, a chapter summary, anything...", emoji picker, color picker (8 swatches). "Generate My Study Plan" button.
**Progress bar:** Animated fill as steps complete.
**Skip option:** "Skip for now" text link on Steps 1 and 2 only (not Step 3).
**On complete:** Redirect to `/dashboard` with confetti animation + toast "🎉 Your first study plan is ready!"

### Screen 4: Dashboard — `/dashboard`
**Goal:** See today's tasks and overall progress at a glance.
**Layout:** Sidebar nav (desktop) / bottom tab nav (mobile) + main content area.
**Components:**
- **Daily Review Card (Hero):** Large card at top. Shows "X cards due today" with a progress ring, estimated time ("~8 min"), and "Start Review" CTA button. Pulse animation if overdue. Empty state: "🎉 You're all caught up!" with a celebration illustration.
- **Streak Widget:** Fire emoji + streak count + "Keep your streak alive!" if last activity was yesterday. Shows freeze shield if streak protected.
- **XP & Level Bar:** Current level badge + XP progress bar to next level + total XP count.
- **Topic Cards Grid:** 2-col (mobile) / 3-col (desktop) cards. Each card shows: topic emoji + title, mastery percentage ring, next review date, card count. Colored left border matching topic color. "Add Topic" card at the end (dashed border, + icon).
- **Recent Activity Feed:** Last 5 review sessions — date, topic, score, XP earned.
**Data sources:** `/api/dashboard`
**Loading state:** Skeleton loaders for each section.
**Empty state (no topics):** Illustration + "Add your first topic to get started" + big "Add Topic" button.

### Screen 5: Add / Edit Topic — `/topics/new` and `/topics/:id/edit`
**Goal:** Log a new learning topic and trigger AI card generation.
**Layout:** Centered single-column form card, max-width 640px.
**Components:**
- **Topic Title:** Large text input, placeholder "What are you learning? e.g. Photosynthesis, React Hooks..."
- **Emoji Picker:** Horizontal scrollable row of 20 emoji options, selected one highlighted.
- **Color Swatches:** 8 color circles to tag the topic (purple, orange, green, blue, pink, red, yellow, teal).
- **Notes Area:** Large textarea (min 6 rows), placeholder "Paste your notes, a textbook excerpt, a YouTube transcript, anything — AI will do the rest. Or leave blank and we'll generate from the title."
- **Card Count Hint:** "We'll generate ~10 review cards from your notes." (updates if notes > 500 chars: "We'll generate ~15 review cards").
- **Generate Button:** "✨ Generate Study Plan" — primary CTA. On click: shows loading state with animated AI spinner + messages ("Reading your notes...", "Creating review cards...", "Building your schedule...").
- **Success State:** Slide in card preview showing 3 sample cards. "Your 12 cards are ready! Start reviewing now?" with "Start Now" and "View All Cards" buttons.
**Validation:** Title required (max 100 chars). Notes max 5000 chars.

### Screen 6: Topic Detail — `/topics/:id`
**Goal:** View and manage all cards for a topic.
**Layout:** Full-width page with top info bar + card grid below.
**Components:**
- **Topic Header:** Large emoji + title, color-matched gradient background, mastery score as circular progress (0-100%), "X cards · Last reviewed Y days ago", Edit button (pencil icon), Delete button.
- **Stats Row:** 4 stat pills — Total Cards, Mastered, Due Today, Avg Ease.
- **Retention Chart:** Small Recharts line chart showing review performance over last 14 sessions.
- **Card List:** Grid of flip-cards. Front shows question, hover/tap reveals back. Each card has Edit (pencil) and Delete (trash) icon buttons.
- **Add Card Button:** "+ Add Card" text button at bottom.
- **"Review Now" FAB:** Floating action button (bottom-right), visible only if cards are due.
**Loading state:** Skeleton for header, shimmer for card grid.
**Empty state:** "No cards yet. Generate cards with AI or add manually."

### Screen 7: Review Session — `/review`
**Goal:** Complete today's review session.
**Layout:** Immersive full-screen mode. No sidebar. Top progress bar. Minimal distractions.
**Components:**
- **Progress Bar:** Thin colored bar at top showing cards completed / total. Animates forward on each card.
- **Card Counter:** "Card 3 of 12" centered above card.
- **Flip Card (Main):** Large card (480px × 300px on desktop, full-width on mobile). Front face shows question. Tap/click triggers 3D CSS flip animation to reveal answer. Card has topic color gradient on back face.
- **Show Answer Button:** Shown only when card is in "front" state. Disappears after flip.
- **Rating Buttons (after flip):** 4 buttons appear with slide-up animation:
  - 🔴 "Forgot" (rating 1) — dark red
  - 🟡 "Hard" (rating 3) — amber
  - 🟢 "Good" (rating 4) — green
  - ⭐ "Easy" (rating 5) — blue
- **XP Pop-up:** On each correct rating (≥3), a "+10 XP" floating text animates upward and fades.
- **Hint Button:** Small "💡 Hint" link below card (if hint exists).
- **Progress Metrics (top-right):** Small flame icon + streak count, XP earned this session.
- **Exit Button:** "×" top-left, shows confirmation modal "End session? Progress will be saved."
- **Session Complete Screen (replaces card):**
  - Confetti animation (canvas-confetti)
  - "Session Complete! 🎉"
  - Stats: Cards reviewed, Accuracy %, XP earned, Time taken
  - Streak message: "🔥 X day streak! Keep it up!"
  - Any new badges earned shown as animated badge reveals
  - Buttons: "Back to Dashboard" | "Review More"
**Keyboard shortcuts:** Space = flip, 1/2/3/4 = ratings (desktop only).

### Screen 8: Progress Page — `/progress`
**Goal:** Deep dive into learning stats and retention health.
**Layout:** Two-column (desktop) / single-column (mobile) dashboard layout.
**Components:**
- **Retention Heatmap:** GitHub-style calendar heatmap (365 days), colored by review intensity. Built with custom SVG + Recharts.
- **Weekly Activity Chart:** Bar chart — cards reviewed per day for last 7 days.
- **Topic Mastery Table:** Sortable table — Topic name, Cards, Mastery %, Due Today, Trend arrow.
- **Stats Cards Row:** Total cards learned, Total review sessions, Overall retention rate, Best streak.
- **Forgetting Curve Widget:** Simple visual showing "without SmartLearner" vs "with SmartLearner" retention over time (static educational graphic).
**Data source:** `/api/progress`

### Screen 9: Achievements — `/achievements`
**Goal:** View earned badges and locked goals.
**Layout:** Grid of badge cards, 3-col desktop / 2-col mobile.
**Components:**
- **Earned Section:** Full-color badge cards with name, description, earned date.
- **Locked Section:** Greyed-out badge cards with lock icon overlay and progress hint ("Review 5 more days to unlock").
**Badge List (defined as constants in code):**

| Badge ID | Name | Icon | Criteria |
|---|---|---|---|
| first_topic | First Step | 📚 | Log first topic |
| first_review | Reviewer | 🔍 | Complete first session |
| streak_3 | On Fire | 🔥 | 3-day streak |
| streak_7 | Week Warrior | ⚡ | 7-day streak |
| streak_30 | Unstoppable | 🏆 | 30-day streak |
| cards_50 | Card Collector | 🃏 | Review 50 cards total |
| cards_500 | Card Master | 👑 | Review 500 cards total |
| perfect_session | Perfect Score | ⭐ | 100% accuracy in a session |
| topics_5 | Curious Mind | 🧠 | Add 5 topics |
| night_owl | Night Owl | 🦉 | Review after 10 PM |
| early_bird | Early Bird | 🐦 | Review before 7 AM |
| level_5 | Scholar | 🎓 | Reach level 5 |
| level_10 | Expert | 💎 | Reach level 10 |

### Screen 10: Settings — `/settings`
**Goal:** Manage account preferences.
**Layout:** Two-column settings layout (sidebar categories + content panel).
**Sections:**
- **Profile:** Display name, avatar emoji, timezone, change password.
- **Notifications:** Toggle daily review reminder, set preferred time (time picker), toggle streak warning emails.
- **Study Preferences:** Default session size (10 / 15 / 20 cards), difficulty preference (Easy / Balanced / Hard).
- **Account:** Export my data (JSON download), Delete account (requires type "DELETE" confirmation).

---

## 7. Component Library & UI Design System

### Design Tokens

**Color Palette:**
```
--color-primary:     #6C47FF  (vibrant purple — brand, CTAs, active states)
--color-primary-light: #EDE9FF (purple tint — backgrounds, hover states)
--color-secondary:   #FF6B35  (energetic orange — accents, XP, highlights)
--color-success:     #00C896  (mint green — correct answers, mastery)
--color-warning:     #FFB800  (golden yellow — streaks, caution)
--color-error:       #FF4757  (red — incorrect, errors)
--color-bg:          #F8F7FF  (soft lavender white — page background)
--color-surface:     #FFFFFF  (card backgrounds)
--color-surface-2:   #F0EEFF  (secondary surface)
--color-text:        #1A1433  (near-black — primary text)
--color-text-muted:  #6B7280  (grey — secondary text)
--color-border:      #E5E0FF  (subtle purple-tinted border)
```

**Typography:**
```
Font: 'Nunito' (Google Fonts) — rounded, friendly, energetic
--font-heading: 'Nunito', sans-serif (weight 800)
--font-body:    'Nunito', sans-serif (weight 400/600)

Scale:
h1: 2.5rem / 800 weight
h2: 2rem / 700 weight
h3: 1.5rem / 700 weight
h4: 1.25rem / 600 weight
body-lg: 1.125rem / 400
body: 1rem / 400
body-sm: 0.875rem / 400
label: 0.75rem / 600 uppercase tracking-wide
```

**Spacing:** 8px base grid. Steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px.

**Border Radius:**
```
--radius-sm:   8px   (inputs, chips)
--radius-md:   12px  (cards, buttons)
--radius-lg:   16px  (large cards, panels)
--radius-xl:   24px  (hero sections, modals)
--radius-full: 9999px (badges, pills, FABs)
```

**Shadows:**
```
--shadow-sm:  0 1px 3px rgba(108,71,255,0.08)
--shadow-md:  0 4px 16px rgba(108,71,255,0.12)
--shadow-lg:  0 8px 32px rgba(108,71,255,0.16)
--shadow-glow: 0 0 24px rgba(108,71,255,0.3)  (active/hover special states)
```

**Motion:**
```
transition-fast: 150ms ease
transition-base: 250ms ease
transition-slow: 400ms cubic-bezier(0.34, 1.56, 0.64, 1) (bouncy spring)
Card flip: 600ms preserve-3d rotateY(180deg)
XP pop: translateY(-32px) + fadeOut over 800ms
Confetti: canvas-confetti library, 3s burst
```

### Core Components

**`<Button />`** — Variants: `primary` (purple fill), `secondary` (white + purple border), `ghost` (transparent), `danger` (red). Sizes: `sm`, `md`, `lg`. States: default, hover (scale 1.02 + glow), active (scale 0.98), loading (spinner), disabled (opacity 0.5). All buttons have `border-radius: --radius-full`.

**`<Card />`** — White background, `--shadow-md`, `--radius-lg`. Variants: `default`, `interactive` (hover lift + shadow-lg), `colored` (left 4px border in topic color), `glass` (backdrop-blur for overlays).

**`<TopicCard />`** — Extends `<Card interactive>`. Displays: colored emoji circle, title, mastery ring (SVG circle progress), subtitle line, color-coded left border. Click navigates to topic detail.

**`<FlipCard />`** — CSS 3D flip card. Front/back faces styled differently. `perspective: 1000px` on container. Tap or button click triggers flip. Back face has topic color gradient.

**`<RatingButton />`** — Large tappable buttons (min 56px height on mobile). Colored by rating level. Slide-up animation on appear (staggered 50ms each). Haptic feedback on mobile (navigator.vibrate).

**`<XPBadge />`** — Small pill showing level number with crown icon. Color-coded by level tier (1-5 purple, 6-10 gold, 11+ diamond).

**`<StreakBadge />`** — Flame icon + count. Animated flicker on streak days. Goes grey if no activity today.

**`<MasteryRing />`** — SVG circle progress indicator. Color: green at 100%, yellow 50-99%, red < 50%. Animated on mount.

**`<ProgressBar />`** — Horizontal bar with gradient fill (primary → secondary). Animated width transition.

**`<BadgeCard />`** — Square card with large icon, name, description. Locked variant: greyscale + lock icon + progress hint.

**`<EmptyState />`** — Centered illustration (inline SVG), heading, subtext, optional CTA button. Used on dashboard (no topics), topic detail (no cards), progress (no data yet).

**`<Skeleton />`** — Animated shimmer loading placeholder. Matches shape of actual content.

**`<Toast />`** — Via react-hot-toast. Custom styled: purple border-left for info, green for success, red for error. Duration 3000ms.

---

## 8. User Flows & Business Logic

### Flow 1: New User Onboarding → First Review

1. User visits `/` → clicks "Get Started"
2. Redirected to `/auth` → signs up with email or Google
3. Email signup: verification email sent via Supabase → user clicks link → verified
4. On first login (no profile row exists), redirected to `/onboarding`
5. Onboarding Step 1: Sets display name + timezone + avatar
6. Onboarding Step 2: Picks learning goal (optional, cosmetic)
7. Onboarding Step 3: Enters topic title + optional notes → clicks "Generate Study Plan"
8. API: `POST /api/topics` → server calls Anthropic API:
   ```
   System: "You are a learning expert. Generate 10-15 review flashcards from the provided topic.
   Return JSON array: [{front: string, back: string, hint?: string, type: 'basic'|'mcq'}]"
   User: "Topic: [title]. Notes: [rawNotes or empty]"
   ```
9. Cards saved to DB with SM-2 defaults (ease=2.5, interval=1, next_review=now)
10. User sees card preview → clicks "Start Now"
11. First review session begins at `/review`
12. On session complete: confetti + "First Step" badge earned + 50 XP

**Edge case — AI generation fails:** Fallback to 5 template cards with generic prompts like "Explain [topic] in your own words." Toast: "AI is busy, we created starter cards for you."

**Edge case — Empty notes field:** AI generates from title only, creates more general conceptual cards.

### Flow 2: Daily Review Loop

1. User returns to app → `/dashboard` shows "X cards due today"
2. Cards due = `WHERE user_id = ? AND next_review_at <= NOW()` ordered by `next_review_at ASC` (most overdue first), limited to `session_size` preference (default 20)
3. User clicks "Start Review"
4. `POST /api/reviews/session/start` → creates session record, returns session ID + shuffled card queue
5. For each card:
   a. Card displayed face-down (question)
   b. User taps "Show Answer" or hits Space
   c. Card flips (600ms animation)
   d. Rating buttons appear (slide-up)
   e. User rates 1-5
   f. `POST /api/reviews/session/:id/submit-card` → SM-2 calc → updates `review_cards` → saves `review_results`
   g. XP awarded: rating 3=10XP, 4=15XP, 5=20XP, 1-2=5XP
6. After last card: `POST /api/reviews/session/:id/complete`
7. Server checks: streak update, badge triggers, level-up check
8. Session complete screen with summary

**Streak logic:**
- Streak increments if a session is completed and `last_activity_date` was yesterday OR today
- Streak resets to 0 if `last_activity_date` < yesterday (missed a day)
- Streak freeze: if user has a "freeze" item (v2 feature, defer), streak is protected for 1 missed day

**XP & Level thresholds:**
```typescript
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5800, 8000, ...];
// Level = index of first threshold > user.xp_total
```

**Badge check (run after each session complete):**
```typescript
// Check all badge criteria against current user stats
// Insert into achievements where badge not already earned
// Return newly earned badges to client for animation
```

### Flow 3: Adding Topic with Rich Notes

1. User clicks "+ Add Topic" (dashboard card or sidebar button)
2. Navigates to `/topics/new`
3. Fills form (title required, notes optional)
4. Clicks "Generate Study Plan"
5. Button shows loading state with rotating messages (1.5s intervals):
   - "Reading your notes..."
   - "Identifying key concepts..."
   - "Creating review cards..."
   - "Building your schedule..."
6. AI generates 10-15 cards (streamed response not used — wait for full response)
7. Cards saved, `topics.card_count` updated
8. Success state: Card preview + redirect options

**Business rules:**
- Max 50 topics per user (v1 limit, soft enforced with warning at 45)
- Max 100 cards per topic (AI generates max 15; manual adds can go higher)
- Notes input max 5000 characters
- Title max 100 characters

---

## 9. State Management

| State Type | Where | Technology | Example |
|---|---|---|---|
| Authenticated user | Global | Zustand `useAuthStore` | `{ user, session, isLoading }` |
| Review session state | Global | Zustand `useSessionStore` | `{ cards[], currentIndex, sessionId, xpEarned }` |
| XP animation queue | Global | Zustand `useXPStore` | `{ pendingXP, triggerAnimation }` |
| All API data | Server cache | TanStack Query | Topics list, dashboard data, review queue |
| Form state | Local | React Hook Form | Topic create form, settings form |
| Modal/drawer open | Local | `useState` | Card edit modal, delete confirm |
| Card flip state | Local | `useState` | `isFlipped: boolean` per card |

**Zustand `useSessionStore` shape:**
```typescript
interface SessionStore {
  sessionId: string | null;
  cards: ReviewCard[];
  currentIndex: number;
  results: CardResult[];
  xpEarned: number;
  startSession: (sessionId: string, cards: ReviewCard[]) => void;
  submitCard: (cardId: string, rating: number) => void;
  completeSession: () => SessionSummary;
  reset: () => void;
}
```

**TanStack Query keys:**
```typescript
['dashboard']                    // Dashboard data
['topics']                       // User topics list
['topics', topicId]              // Single topic
['topics', topicId, 'cards']    // Cards for topic
['review-queue']                 // Today's due cards
['progress']                     // Progress page data
['achievements']                 // Badges data
```

---

## 10. Security & Performance

### Auth
- Supabase Auth with JWT. Tokens stored in Supabase-managed httpOnly cookies (automatic).
- Row Level Security (RLS) enabled on all tables: `USING (user_id = auth.uid())`
- Google OAuth: only email scope requested.

### Input Validation
- All API inputs validated with Zod on the server before DB queries.
- Raw notes sanitized: strip HTML tags, limit to 5000 chars, no executable content.
- AI prompt injection defense: user content wrapped in XML tags `<user_content>...</user_content>` in Claude prompts.

### Rate Limiting
- AI generation endpoints: 10 calls/hour per user (tracked via Supabase `ratelimit` table or Upstash Redis in v2).
- Auth endpoints: handled by Supabase (built-in rate limiting).

### Performance Budgets
- Dashboard load (TTI): < 2 seconds on 3G
- Review card flip: < 16ms (CSS only, no JS layout)
- AI generation response: < 10 seconds (show loading UI, do not block)
- API response time target: < 300ms for non-AI endpoints

### Caching
- TanStack Query: `staleTime: 5 * 60 * 1000` (5 min) for dashboard, progress data
- Review queue: `staleTime: 0` (always fresh — due dates are time-sensitive)
- Next.js: Static landing page (SSG), dynamic routes with SSR for SEO

---

## 11. File & Folder Structure

```
smartlearner/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout)
│   │   └── auth/page.tsx
│   ├── (marketing)/              # Public pages group
│   │   └── page.tsx              # Landing page
│   ├── (app)/                    # Authenticated app group
│   │   ├── layout.tsx            # App shell (sidebar + bottom nav)
│   │   ├── dashboard/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── topics/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Topic detail
│   │   │       └── edit/page.tsx
│   │   ├── review/page.tsx
│   │   ├── progress/page.tsx
│   │   ├── achievements/page.tsx
│   │   └── settings/page.tsx
│   └── api/                      # API Routes
│       ├── topics/
│       │   ├── route.ts          # GET, POST /api/topics
│       │   └── [id]/
│       │       ├── route.ts      # GET, PATCH, DELETE /api/topics/:id
│       │       └── cards/route.ts
│       ├── reviews/
│       │   ├── queue/route.ts
│       │   └── session/
│       │       ├── start/route.ts
│       │       └── [id]/
│       │           ├── submit-card/route.ts
│       │           └── complete/route.ts
│       ├── dashboard/route.ts
│       ├── progress/route.ts
│       ├── achievements/route.ts
│       ├── ai/
│       │   ├── generate-cards/route.ts
│       │   └── explain-card/route.ts
│       └── notifications/route.ts
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx
│   │   └── AppShell.tsx
│   ├── dashboard/
│   │   ├── DailyReviewCard.tsx
│   │   ├── StreakWidget.tsx
│   │   ├── TopicGrid.tsx
│   │   └── RecentActivity.tsx
│   ├── review/
│   │   ├── FlipCard.tsx
│   │   ├── RatingButtons.tsx
│   │   ├── SessionProgress.tsx
│   │   └── SessionComplete.tsx
│   ├── topics/
│   │   ├── TopicCard.tsx
│   │   ├── TopicForm.tsx
│   │   └── CardList.tsx
│   ├── progress/
│   │   ├── RetentionHeatmap.tsx
│   │   └── WeeklyChart.tsx
│   └── shared/
│       ├── XPBadge.tsx
│       ├── MasteryRing.tsx
│       ├── BadgeCard.tsx
│       ├── EmptyState.tsx
│       └── Skeleton.tsx
├── lib/
│   ├── sm2.ts                    # SM-2 spaced repetition algorithm
│   ├── badges.ts                 # Badge definitions + check functions
│   ├── xp.ts                     # XP calculation + level thresholds
│   ├── ai.ts                     # Anthropic API wrapper functions
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server-side Supabase client
│   └── validations/
│       ├── topic.ts              # Zod schemas for topics
│       └── review.ts             # Zod schemas for review
├── stores/
│   ├── auth.store.ts             # Zustand auth store
│   ├── session.store.ts          # Review session store
│   └── xp.store.ts               # XP animation store
├── hooks/
│   ├── useTopics.ts              # TanStack Query hooks for topics
│   ├── useDashboard.ts
│   ├── useReviewQueue.ts
│   └── useProgress.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── illustrations/            # SVG empty state illustrations
│   └── og-image.png
├── styles/
│   └── globals.css               # Tailwind base + CSS variables
├── types/
│   └── index.ts                  # Shared TypeScript types
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

**Naming conventions:**
- Components: PascalCase (`FlipCard.tsx`)
- Hooks: camelCase with `use` prefix (`useTopics.ts`)
- API routes: `route.ts` (Next.js convention)
- Stores: `[name].store.ts`
- Utils/lib: camelCase (`sm2.ts`)
- Types: PascalCase interfaces (`ReviewCard`, `Topic`, `User`)

---

## 12. Environment & Configuration

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only, never expose to client

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...      # Server-side only, never expose to client

# Resend Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@smartlearner.app

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # https://smartlearner.app in prod
NEXT_PUBLIC_APP_NAME=SmartLearner

# Optional: Cron secret for Vercel Cron Jobs
CRON_SECRET=your-random-secret
```

**External Service Setup:**
- **Supabase:** Create project → enable Google OAuth (add redirect URL) → run Prisma migrations → enable RLS on all tables → add RLS policies.
- **Anthropic:** Create API key at console.anthropic.com → use `claude-sonnet-4-20250514` model.
- **Resend:** Create account → verify sending domain → get API key.
- **Vercel:** Connect GitHub repo → add environment variables → configure cron job in `vercel.json`.

**`vercel.json` cron configuration:**
```json
{
  "crons": [
    {
      "path": "/api/cron/send-review-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 13. Development Phases (Implementation Order)

### Phase 1 — Foundation (Week 1)
*Goal: Deployable app with auth and basic data model.*
1. Initialize Next.js 14 project with TypeScript + Tailwind + shadcn/ui
2. Set up Supabase project + Prisma schema + run initial migration
3. Implement Supabase Auth (email + Google OAuth) — `/auth` page
4. Build AppShell layout (sidebar desktop + bottom nav mobile)
5. Implement RLS policies on all tables
6. Deploy to Vercel + configure environment variables
7. **Milestone: Can sign up, log in, see empty dashboard**

### Phase 2 — Core Feature: Topics + AI (Week 2)
*Goal: User can add a topic and get AI-generated cards.*
1. Build `/topics/new` form with validation
2. Implement `POST /api/topics` → Anthropic API integration
3. Build SM-2 algorithm in `/lib/sm2.ts` with tests
4. Save generated cards to DB
5. Build topic detail page (`/topics/:id`) with card list
6. Build card flip component (basic, no animation yet)
7. **Milestone: Log a topic, see AI-generated cards**

### Phase 3 — Review Session Engine (Week 3)
*Goal: Full review loop working end-to-end.*
1. Implement review queue API (`GET /api/reviews/queue`)
2. Build review session flow — start, submit, complete APIs
3. Build FlipCard with 3D CSS animation (Framer Motion)
4. Build RatingButtons with slide-up animation
5. Connect SM-2 calculation to card updates
6. Build SessionComplete screen with basic stats
7. **Milestone: Complete a full review session with SM-2 scheduling**

### Phase 4 — Gamification (Week 4)
*Goal: XP, streaks, levels, badges all working.*
1. Implement XP calculation + award logic
2. Implement streak tracking (last_activity_date logic)
3. Build level system with thresholds
4. Implement all 13 badges with check functions
5. Build XP pop-up animation + confetti on session complete
6. Build `/achievements` page
7. Add streak widget + XP bar to dashboard
8. **Milestone: Gamification loop fully operational**

### Phase 5 — Dashboard & Progress (Week 5)
*Goal: Full visibility into learning health.*
1. Build `/dashboard` with all widgets (daily card, streak, XP, topic grid)
2. Build `GET /api/dashboard` aggregation query
3. Build `/progress` page with heatmap + charts
4. Build `GET /api/progress` with full stats
5. Implement onboarding wizard (`/onboarding`)
6. **Milestone: Full dashboard + progress visibility**

### Phase 6 — Polish, Email & Launch (Week 6)
*Goal: Production-ready, users can be invited.*
1. Add email notifications via Resend (review reminders, welcome email)
2. Implement Vercel Cron for daily reminder emails
3. Build landing page (`/`) with proper SEO
4. Add `/settings` page with notification preferences + data export
5. Full mobile responsiveness audit + fixes
6. Accessibility pass (focus states, ARIA labels, contrast check)
7. Performance audit (Core Web Vitals, image optimization)
8. Error boundary setup + Sentry integration (optional)
9. **Milestone: App ready for first real users**

---

## UI Design Language (Google Stitch Prompt)

**Visual style:** Colorful, playful, gamified — inspired by Duolingo but more vibrant and content-rich. Energy and joy through every interaction. Learning should feel like a game, not a chore.

**Color palette:** Vibrant purple (#6C47FF) as dominant brand color, warm orange (#FF6B35) for accents and XP highlights, mint green (#00C896) for success states, golden yellow (#FFB800) for streaks and warnings, soft lavender white (#F8F7FF) as page background. High contrast, accessible.

**Typography:** Nunito font throughout — rounded letterforms, warm and approachable. Heavy weight (800) for headings to create impact. Regular weight for body text. Labels in small caps.

**Border radius:** Very rounded — pill-shaped buttons, 16px cards, 24px modals. Nothing sharp or corporate.

**Shadows & depth:** Cards have soft purple-tinted shadows. Active states reveal a glow effect. The page feels layered and tactile.

**Spacing system:** Generous — 8px grid, content breathes. Not cramped.

**Icon style:** Filled icons (Lucide filled variants) with large emoji used as topic/badge identifiers. Emoji-first UI for warmth.

**Motion intent:** Bouncy and satisfying. Card flip is the hero animation. XP pops up and floats away. Buttons scale on hover. Page transitions slide in. Confetti on achievements. Never janky — always at 60fps.

**Navigation:** Bottom tab bar on mobile (4 items: Home, Topics, Review, Profile). Left sidebar on desktop (collapsible, icon+label).

**Key UI patterns:** Gamification widgets (streak counter, XP bar, level badge), flip cards, rating button row, progress rings, achievement badge grid, retention heatmap.

**Reference apps:** Duolingo (gamification patterns, streak mechanic), Linear (clean sidebar layout, attention to detail), Headspace (friendly typography, calming color accents). Avoid: grey enterprise aesthetic, small text, dark backgrounds (light mode preferred).

**Copy & tone:** Encouraging, energetic, friendly. "You're on fire! 🔥" not "Streak maintained." "Let's see what you remember" not "Begin review session." CTA buttons: "Start Learning", "Let's Go!", "Show Answer", "Keep Going". Error messages: "Hmm, something went wrong. Try again?" Empty states: "Nothing here yet — add your first topic and let's get started! 🚀"

---

*This PRD is complete and ready to hand to a coding agent. All sections are unambiguous. Any remaining product decisions are documented as assumptions inline. Build Phase 1 first — it should produce something interactive within one week.*
