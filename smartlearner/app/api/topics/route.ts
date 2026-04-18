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
    const topics = await prisma.topic.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: { topics } });
  } catch (error) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch topics", status: 500 } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, rawNotes, emoji, color } = body;

    if (!title) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Title is required", status: 400 } }, { status: 400 });
    }

    const topic = await prisma.topic.create({
      data: {
        user_id: user.id,
        title,
        description: description || null,
        raw_notes: rawNotes || null,
        emoji: emoji || "📚",
        color: color || "#6C47FF",
      },
    });

    // TODO: Trigger AI card generation asynchronously or inline
    return NextResponse.json({ data: { topic, cards: [], generationStatus: "pending" } });
  } catch (error) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create topic", status: 500 } }, { status: 500 });
  }
}
