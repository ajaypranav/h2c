import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } },
      { status: 401 }
    );
  }

  try {
    const achievements = await prisma.achievement.findMany({
      where: { user_id: user.id },
      orderBy: { earned_at: 'desc' }
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    const totalTopics = await prisma.topic.count({ where: { user_id: user.id } });
    const totalCardsReviewed = await prisma.reviewSession.aggregate({
      where: { user_id: user.id },
      _sum: { cards_reviewed: true }
    });
    
    // Check perfect sessions (accuracy >= 100% implicitly if correct == reviewed & reviewed > 0)
    const perfectSessions = await prisma.reviewSession.count({
      where: {
        user_id: user.id,
        cards_reviewed: { gt: 0 },
        // Prisma can't directly compare columns easily in aggregate without raw query, 
        // so we can approximate or use a raw query. We'll just fetch them to count since sessions won't be millions yet
      }
    });
    
    // refine perfect session calculation
    const allSessions = await prisma.reviewSession.findMany({
      where: { user_id: user.id, cards_reviewed: { gt: 0 } },
      select: { cards_reviewed: true, cards_correct: true }
    });
    const perfectCount = allSessions.filter(s => s.cards_correct === s.cards_reviewed).length;

    const userStats = {
      totalTopics,
      totalCardsReviewed: totalCardsReviewed._sum.cards_reviewed || 0,
      streakCount: dbUser?.streak_count || 0,
      longestStreak: dbUser?.longest_streak || 0,
      level: dbUser?.level || 1,
      perfectSessions: perfectCount,
      reviewHour: 12, // mock, depends on actual review time which is dynamic
    };

    return NextResponse.json({
      data: {
        achievements,
        userStats
      }
    });

  } catch (error) {
    console.error("Fetch achievements error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch achievements", status: 500 } },
      { status: 500 }
    );
  }
}
