import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
  }

  try {
    // Ensure the users table has this user (synced from Supabase Auth)
    // Normally handled by a DB trigger, but we'll fetch what exists
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    const dueCardsCount = await prisma.reviewCard.count({
      where: {
        user_id: user.id,
        next_review_at: { lte: new Date() }
      }
    });

    const recentActivity = await prisma.reviewSession.findMany({
      where: { user_id: user.id, completed_at: { not: null } },
      orderBy: { completed_at: "desc" },
      take: 5,
      include: { topic: { select: { title: true, emoji: true } } }
    });

    return NextResponse.json({ 
      data: { 
        dueCount: dueCardsCount, 
        streak: dbUser?.streak_count || 0, 
        xp: dbUser?.xp_total || 0, 
        level: dbUser?.level || 1, 
        recentActivity 
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch dashboard data", status: 500 } }, { status: 500 });
  }
}
