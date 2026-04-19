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
    // 1. Get basic stats
    const totalSessions = await prisma.reviewSession.count({
      where: { user_id: user.id, completed_at: { not: null } }
    });

    const totalCardsLearned = await prisma.reviewCard.count({
      where: { user_id: user.id, repetitions: { gt: 0 } }
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { longest_streak: true }
    });
    
    // Retention rate roughly based on total times correct vs total answering
    const allCards = await prisma.reviewCard.findMany({
      where: { user_id: user.id },
      select: { times_correct: true, times_incorrect: true }
    });

    let totalCorrect = 0;
    let totalAttempts = 0;
    allCards.forEach(c => {
      totalCorrect += c.times_correct;
      totalAttempts += (c.times_correct + c.times_incorrect);
    });

    let retentionRate = 0;
    if (totalAttempts > 0) {
      retentionRate = Math.round((totalCorrect / totalAttempts) * 100);
    }
    
    // 2. Generate Heatmap data (last 365 days)
    // For a real app, query review_results to group by date. For now, fetch recent results or mock structure correctly
    const recentResults = await prisma.reviewResult.findMany({
      where: { user_id: user.id },
      select: { reviewed_at: true },
      orderBy: { reviewed_at: 'desc' },
      take: 1000 // Sample size
    });

    const heatmapMap = new Map<string, number>();
    recentResults.forEach(r => {
      const dateStr = r.reviewed_at.toISOString().split("T")[0];
      heatmapMap.set(dateStr, (heatmapMap.get(dateStr) || 0) + 1);
    });

    const heatmapData = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = heatmapMap.get(dateStr) || 0;
      heatmapData.push({
        date: dateStr,
        count,
        level: (count === 0 ? 0 : count < 5 ? 1 : count < 10 ? 2 : count < 20 ? 3 : 4) as 0 | 1 | 2 | 3 | 4,
      });
    }

    // 3. Weekly Data (Mon - Sun of current week)
    const currentDayOfWeek = today.getDay() || 7; // Sunday is 0, make it 7
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    const weeklyResults = await prisma.reviewResult.findMany({
      where: {
        user_id: user.id,
        reviewed_at: { gte: monday }
      },
      select: { reviewed_at: true }
    });

    const weeklyMap = new Map<number, number>(); // 1 (Mon) - 7 (Sun)
    weeklyResults.forEach(r => {
      const day = r.reviewed_at.getDay() || 7;
      weeklyMap.set(day, (weeklyMap.get(day) || 0) + 1);
    });

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyData = dayLabels.map((lbl, i) => ({
      day: lbl,
      cards: weeklyMap.get(i + 1) || 0
    }));

    // 4. Topic Mastery Breakdown
    const topicBreakdown = await prisma.topic.findMany({
      where: { user_id: user.id },
      select: { title: true, emoji: true, color: true, mastery_score: true },
      orderBy: { mastery_score: 'desc' },
      take: 4
    });

    return NextResponse.json({
      data: {
        totalSessions,
        totalCardsLearned,
        retentionRate,
        bestStreak: dbUser?.longest_streak || 0,
        heatmapData,
        weeklyData,
        topicBreakdown
      }
    });

  } catch (error) {
    console.error("Fetch progress error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch progress", status: 500 } },
      { status: 500 }
    );
  }
}
