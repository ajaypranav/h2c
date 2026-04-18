import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/reviews/session/start
 * Creates a new review session and returns its ID.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    const session = await prisma.reviewSession.create({
      data: {
        user_id: user.id,
        topic_id: body.topicId || null,
        session_type: body.sessionType || "scheduled",
      },
    });

    return NextResponse.json({ data: { session } });
  } catch (error) {
    console.error("Session start error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to start session", status: 500 } },
      { status: 500 }
    );
  }
}
