import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

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
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        display_name: true,
        avatar_url: true,
      }
    });

    return NextResponse.json({
      data: dbUser
    });

  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch user settings", status: 500 } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized", status: 401 } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { display_name, avatar_url } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        display_name,
        avatar_url
      },
      select: {
        display_name: true,
        avatar_url: true,
      }
    });

    return NextResponse.json({
      data: updatedUser
    });

  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update user settings", status: 500 } },
      { status: 500 }
    );
  }
}
