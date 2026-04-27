import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/topics/[id]/cards — List all cards for a topic
 */
export async function GET(
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

  const { id: topicId } = await params;

  try {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic || topic.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Topic not found", status: 404 } },
        { status: 404 }
      );
    }

    const cards = await prisma.reviewCard.findMany({
      where: { topic_id: topicId },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json({ data: { cards } });
  } catch (error) {
    console.error("Fetch cards error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch cards", status: 500 } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/topics/[id]/cards — Manually add a card
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

  const { id: topicId } = await params;

  try {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic || topic.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Topic not found", status: 404 } },
        { status: 404 }
      );
    }

    // Card limit check
    const cardCount = await prisma.reviewCard.count({ where: { topic_id: topicId } });
    if (cardCount >= 100) {
      return NextResponse.json(
        { error: { code: "LIMIT_REACHED", message: "Maximum 100 cards per topic", status: 400 } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { front, back, hint } = body;

    if (!front || !back) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "front and back are required", status: 400 } },
        { status: 400 }
      );
    }

    const card = await prisma.reviewCard.create({
      data: {
        topic_id: topicId,
        user_id: user.id,
        front: front.trim(),
        back: back.trim(),
        hint: hint?.trim() || null,
        card_type: "basic",
        ai_generated: false,
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
        next_review_at: new Date(),
      },
    });

    // Update topic card count
    await prisma.topic.update({
      where: { id: topicId },
      data: { card_count: { increment: 1 } },
    });

    return NextResponse.json({ data: { card } });
  } catch (error) {
    console.error("Create card error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create card", status: 500 } },
      { status: 500 }
    );
  }
}
