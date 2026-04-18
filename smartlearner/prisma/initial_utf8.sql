-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "xp_total" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" DATE,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "learning_goal" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "raw_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "card_count" INTEGER NOT NULL DEFAULT 0,
    "mastery_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "color" TEXT NOT NULL DEFAULT '#6C47FF',
    "emoji" TEXT NOT NULL DEFAULT '≡ƒôÜ',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_cards" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "card_type" TEXT NOT NULL DEFAULT 'basic',
    "mcq_options" JSONB,
    "hint" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ai_generated" BOOLEAN NOT NULL DEFAULT true,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval_days" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "next_review_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reviewed_at" TIMESTAMPTZ,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "times_incorrect" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic_id" TEXT,
    "session_type" TEXT NOT NULL DEFAULT 'scheduled',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "cards_reviewed" INTEGER NOT NULL DEFAULT 0,
    "cards_correct" INTEGER NOT NULL DEFAULT 0,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "duration_secs" INTEGER,

    CONSTRAINT "review_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_results" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "response_time_ms" INTEGER,
    "new_interval" INTEGER NOT NULL,
    "new_ease_factor" DOUBLE PRECISION NOT NULL,
    "reviewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "topics_user_id_status_idx" ON "topics"("user_id", "status");

-- CreateIndex
CREATE INDEX "topics_user_id_created_at_idx" ON "topics"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "review_cards_user_id_next_review_at_idx" ON "review_cards"("user_id", "next_review_at");

-- CreateIndex
CREATE INDEX "review_cards_topic_id_idx" ON "review_cards"("topic_id");

-- CreateIndex
CREATE INDEX "review_results_user_id_reviewed_at_idx" ON "review_results"("user_id", "reviewed_at" DESC);

-- CreateIndex
CREATE INDEX "review_results_card_id_reviewed_at_idx" ON "review_results"("card_id", "reviewed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "achievements_user_id_badge_id_key" ON "achievements"("user_id", "badge_id");

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_results" ADD CONSTRAINT "review_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_results" ADD CONSTRAINT "review_results_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "review_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_results" ADD CONSTRAINT "review_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

