import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/auth/sync
 * Ensures the authenticated Supabase user has a corresponding row
 * in our `users` table. Called after sign-in / sign-up.
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

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        display_name: body.displayName || user.user_metadata?.display_name || user.email!.split("@")[0],
        avatar_url: body.avatar || user.user_metadata?.avatar_url || null,
        timezone: body.timezone || "UTC",
        learning_goal: body.learningGoal || null,
      },
      create: {
        id: user.id,
        email: user.email!,
        display_name: body.displayName || user.user_metadata?.display_name || user.email!.split("@")[0],
        avatar_url: body.avatar || user.user_metadata?.avatar_url || null,
        timezone: body.timezone || "UTC",
        learning_goal: body.learningGoal || null,
      },
    });

    return NextResponse.json({ data: { user: dbUser } });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to sync user", status: 500 } },
      { status: 500 }
    );
  }
}
