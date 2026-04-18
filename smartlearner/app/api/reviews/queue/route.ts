import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/reviews/queue
 * Returns today's due cards (max 20), sorted by overdue priority.
 */
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
    const dueCards = await prisma.reviewCard.findMany({
      where: {
        user_id: user.id,
        next_review_at: { lte: new Date() },
      },
      orderBy: { next_review_at: "asc" },
      take: 20,
      include: {
        topic: {
          select: { title: true, emoji: true, color: true },
        },
      },
    });

    return NextResponse.json({ data: { cards: dueCards, total: dueCards.length } });
  } catch (error) {
    console.error("Review queue error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch review queue", status: 500 } },
      { status: 500 }
    );
  }
}
