import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { getLevelFromXP } from "@/lib/xp";

/**
 * POST /api/reviews/session/[id]/complete
 * Marks a review session as complete. Updates user streak and level.
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
    const body = await request.json().catch(() => ({}));
    const { scheduleId } = body;

    // Complete the session
    const session = await prisma.reviewSession.update({
      where: { id: sessionId },
      data: {
        completed_at: new Date(),
        duration_secs: Math.floor((Date.now() - new Date().getTime()) / 1000) || 0,
      },
    });

    if (scheduleId) {
      // Mark the static topic schedule as completed
      await prisma.topicReviewSchedule.update({
        where: { id: scheduleId },
        data: { status: "completed" },
      }).catch(e => console.error("Failed to update schedule:", e));
    }

    // Update user streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found", status: 404 } },
        { status: 404 }
      );
    }

    let newStreak = dbUser.streak_count;
    const lastActivity = dbUser.last_activity_date
      ? new Date(dbUser.last_activity_date)
      : null;

    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        // Consecutive day — increment streak
        newStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken — reset to 1
        newStreak = 1;
      }
      // diffDays === 0 means same day, keep streak as-is
    } else {
      newStreak = 1;
    }

    // Recalculate level from total XP
    const newLevel = getLevelFromXP(dbUser.xp_total);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        streak_count: newStreak,
        longest_streak: Math.max(newStreak, dbUser.longest_streak),
        last_activity_date: today,
        level: newLevel,
      },
    });

    // Calculate accuracy
    const accuracy =
      session.cards_reviewed > 0
        ? Math.round((session.cards_correct / session.cards_reviewed) * 100)
        : 0;

    return NextResponse.json({
      data: {
        session,
        totalXP: session.xp_earned,
        newLevel: updatedUser.level,
        streakCount: updatedUser.streak_count,
        accuracy,
      },
    });
  } catch (error) {
    console.error("Session complete error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to complete session", status: 500 } },
      { status: 500 }
    );
  }
}
