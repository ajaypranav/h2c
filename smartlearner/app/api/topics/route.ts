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

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Title is required", status: 400 } }, { status: 400 });
    }

    if (title.length > 100) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Title must be 100 characters or less", status: 400 } }, { status: 400 });
    }

    // Topic limit check
    const topicCount = await prisma.topic.count({ where: { user_id: user.id } });
    if (topicCount >= 50) {
      return NextResponse.json({ error: { code: "LIMIT_REACHED", message: "You've reached the maximum of 50 topics. Delete some to add more.", status: 400 } }, { status: 400 });
    }

    // Sanitize notes — strip HTML tags
    const sanitizedNotes = rawNotes
      ? rawNotes.replace(/<[^>]*>/g, "").substring(0, 5000)
      : null;

    const topic = await prisma.topic.create({
      data: {
        user_id: user.id,
        title: title.trim(),
        description: description || null,
        raw_notes: sanitizedNotes,
        emoji: emoji || "📚",
        color: color || "#6C47FF",
      },
    });

    // Generate cards with AI
    const cardCount = sanitizedNotes && sanitizedNotes.length > 500 ? 15 : 10;
    let cards: Record<string, unknown>[] = [];
    let generationStatus: "complete" | "fallback" | "error" = "complete";

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));
      const generateRes = await fetch(`${baseUrl}/api/ai/generate-cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          topicId: topic.id,
          title: topic.title,
          rawNotes: sanitizedNotes,
          cardCount,
        }),
      });

      if (generateRes.ok) {
        const genData = await generateRes.json();
        cards = genData.data?.cards || [];
        if (genData.data?.source === "fallback") {
          generationStatus = "fallback";
        }
      } else {
        generationStatus = "error";
      }
    } catch (genError) {
      console.error("Card generation call failed:", genError);
      generationStatus = "error";
    }

    // Re-fetch topic to get updated card count
    const updatedTopic = await prisma.topic.findUnique({ where: { id: topic.id } });

    return NextResponse.json({
      data: {
        topic: updatedTopic || topic,
        cards,
        generationStatus,
      },
    });
  } catch (error) {
    console.error("Create topic error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create topic", status: 500 } }, { status: 500 });
  }
}
