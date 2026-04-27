import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

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

  const { id } = await params;

  try {
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        review_cards: {
          orderBy: { created_at: "asc" }
        }
      }
    });

    if (!topic || topic.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Topic not found", status: 404 } },
        { status: 404 }
      );
    }

    const dueCount = await prisma.reviewCard.count({
      where: {
        topic_id: id,
        next_review_at: { lte: new Date() },
      }
    });

    // Calculate additional stats
    const cards = topic.review_cards;
    const masteredCount = cards.filter(c => c.ease_factor >= 2.5 && c.repetitions >= 3).length;
    const avgEase = cards.length > 0
      ? Math.round((cards.reduce((sum, c) => sum + c.ease_factor, 0) / cards.length) * 100) / 100
      : 2.5;

    return NextResponse.json({
      data: {
        topic,
        dueCount,
        masteredCount,
        avgEase,
      }
    });
  } catch (error) {
    console.error("Fetch topic error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch topic detail", status: 500 } },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

  const { id } = await params;

  try {
    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic || topic.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Topic not found", status: 404 } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, emoji, color, status } = body;

    const updated = await prisma.topic.update({
      where: { id },
      data: {
        ...(title && { title: title.trim().substring(0, 100) }),
        ...(description !== undefined && { description }),
        ...(emoji && { emoji }),
        ...(color && { color }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ data: { topic: updated } });
  } catch (error) {
    console.error("Update topic error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update topic", status: 500 } },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

  const { id } = await params;

  try {
    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic || topic.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Topic not found", status: 404 } },
        { status: 404 }
      );
    }

    // Cascade delete: cards, sessions, results all cascade via Prisma schema
    await prisma.topic.delete({ where: { id } });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Delete topic error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete topic", status: 500 } },
      { status: 500 }
    );
  }
}
