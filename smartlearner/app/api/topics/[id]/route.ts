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

    return NextResponse.json({
      data: {
        topic,
        dueCount
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
