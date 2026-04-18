import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { calculateSM2, calculateXP, getNextReviewDate } from "@/lib/sm2";

/**
 * POST /api/reviews/session/[id]/submit-card
 * Submits a card rating, runs SM-2, updates the card schedule, and awards XP.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } },
      { status: 401 }
    );
  }

  const { id: sessionId } = await params;

  try {
    const body = await request.json();
    const { cardId, rating, responseTimeMs } = body;

    if (!cardId || rating === undefined || rating < 0 || rating > 5) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "cardId and rating (0-5) are required", status: 400 } },
        { status: 400 }
      );
    }

    // Fetch the card to get current SM-2 state
    const card = await prisma.reviewCard.findUnique({ where: { id: cardId } });
    if (!card || card.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Card not found", status: 404 } },
        { status: 404 }
      );
    }

    // Run SM-2 algorithm
    const sm2Result = calculateSM2(
      rating,
      card.repetitions,
      card.ease_factor,
      card.interval_days
    );

    const xpEarned = calculateXP(rating);
    const nextReviewAt = getNextReviewDate(sm2Result.nextInterval);
    const isCorrect = rating >= 3;

    // Update card with new SM-2 values
    await prisma.reviewCard.update({
      where: { id: cardId },
      data: {
        ease_factor: sm2Result.nextEaseFactor,
        interval_days: sm2Result.nextInterval,
        repetitions: sm2Result.nextRepetitions,
        next_review_at: nextReviewAt,
        last_reviewed_at: new Date(),
        times_correct: isCorrect ? { increment: 1 } : undefined,
        times_incorrect: !isCorrect ? { increment: 1 } : undefined,
      },
    });

    // Create review result
    await prisma.reviewResult.create({
      data: {
        session_id: sessionId,
        card_id: cardId,
        user_id: user.id,
        rating,
        response_time_ms: responseTimeMs || null,
        new_interval: sm2Result.nextInterval,
        new_ease_factor: sm2Result.nextEaseFactor,
      },
    });

    // Update session stats
    await prisma.reviewSession.update({
      where: { id: sessionId },
      data: {
        cards_reviewed: { increment: 1 },
        cards_correct: isCorrect ? { increment: 1 } : undefined,
        xp_earned: { increment: xpEarned },
      },
    });

    // Award XP to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp_total: { increment: xpEarned },
      },
    });

    return NextResponse.json({
      data: {
        xpEarned,
        newInterval: sm2Result.nextInterval,
        newEaseFactor: sm2Result.nextEaseFactor,
        isCorrect,
      },
    });
  } catch (error) {
    console.error("Submit card error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to submit card", status: 500 } },
      { status: 500 }
    );
  }
}
