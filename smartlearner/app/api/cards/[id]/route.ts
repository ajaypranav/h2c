import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

/**
 * PATCH /api/cards/[id] — Edit a card
 */
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
    const card = await prisma.reviewCard.findUnique({ where: { id } });
    if (!card || card.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Card not found", status: 404 } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { front, back, hint } = body;

    const updated = await prisma.reviewCard.update({
      where: { id },
      data: {
        ...(front && { front: front.trim() }),
        ...(back && { back: back.trim() }),
        ...(hint !== undefined && { hint: hint?.trim() || null }),
      },
    });

    return NextResponse.json({ data: { card: updated } });
  } catch (error) {
    console.error("Update card error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update card", status: 500 } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cards/[id] — Delete a card
 */
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
    const card = await prisma.reviewCard.findUnique({ where: { id } });
    if (!card || card.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Card not found", status: 404 } },
        { status: 404 }
      );
    }

    await prisma.reviewCard.delete({ where: { id } });

    // Decrement topic card count
    await prisma.topic.update({
      where: { id: card.topic_id },
      data: { card_count: { decrement: 1 } },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Delete card error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete card", status: 500 } },
      { status: 500 }
    );
  }
}
