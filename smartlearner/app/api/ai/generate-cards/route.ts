import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

interface GeneratedCard {
  front: string;
  back: string;
  hint?: string;
  type: "basic" | "mcq" | "cloze";
}

/**
 * POST /api/ai/generate-cards
 * Generates review cards for a topic using AI (Anthropic) or fallback templates.
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
    const body = await request.json();
    const { topicId, title, rawNotes, cardCount = 10 } = body;

    if (!topicId || !title) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "topicId and title are required", status: 400 } },
        { status: 400 }
      );
    }

    let cards: GeneratedCard[] = [];

    // Try AI generation via Ollama
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";
    const ollamaApiKey = process.env.OLLAMA_API_KEY;

    try {
      cards = await generateWithOllama(title, rawNotes, cardCount, ollamaBaseUrl, ollamaModel, ollamaApiKey);
    } catch (aiError) {
      console.error("Ollama generation failed, using fallback:", aiError);
      cards = generateFallbackCards(title, rawNotes);
    }

    // Save cards to database
    const savedCards = await prisma.reviewCard.createManyAndReturn({
      data: cards.map((card) => ({
        topic_id: topicId,
        user_id: user.id,
        front: card.front,
        back: card.back,
        hint: card.hint || null,
        card_type: card.type || "basic",
        ai_generated: true,
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
        next_review_at: new Date(),
      })),
    });

    // Update topic card count
    await prisma.topic.update({
      where: { id: topicId },
      data: { card_count: savedCards.length },
    });

    return NextResponse.json({
      data: {
        cards: savedCards,
        count: savedCards.length,
        source: cards.length > 0 ? "ai" : "fallback",
      },
    });
  } catch (error) {
    console.error("Generate cards error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate cards", status: 500 } },
      { status: 500 }
    );
  }
}

async function generateWithOllama(
  title: string,
  rawNotes: string | undefined,
  cardCount: number,
  baseUrl: string,
  model: string,
  apiKey?: string
): Promise<GeneratedCard[]> {
  const notesSection = rawNotes
    ? `\n\nUser's notes:\n${rawNotes}`
    : "";

  const systemPrompt = `You are an expert educational content creator. Generate high-quality review flashcards for spaced repetition study.

Rules:
- Create exactly ${cardCount} cards
- Each card should test ONE concept
- Questions should be clear and unambiguous
- Answers should be concise but complete
- Include helpful hints where appropriate
- Mix card types: mostly "basic" (Q&A), some "cloze" (fill-in-blank style)
- Return ONLY a valid JSON array, no markdown fences or explanation

Return format:
[{"front": "question", "back": "answer", "hint": "optional hint", "type": "basic"}]`;

  const userPrompt = `Create ${cardCount} review flashcards for the topic: "${title}"${notesSection}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.message?.content;
  if (!content) throw new Error("No content in Ollama response");

  // Parse JSON from the response (handle potential markdown wrapping)
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/```(?:json)?\n?/g, "").trim();
  }

  // Try to extract array from response
  const parsed = JSON.parse(jsonStr);
  const cardsArray = Array.isArray(parsed) ? parsed : parsed.cards || parsed.flashcards || [];
  if (!Array.isArray(cardsArray) || cardsArray.length === 0) throw new Error("Response is not a valid card array");

  return cardsArray.map((card: Record<string, string>) => ({
    front: card.front || "",
    back: card.back || "",
    hint: card.hint || undefined,
    type: (card.type as "basic" | "mcq" | "cloze") || "basic",
  }));
}

/**
 * Generates template cards when AI is unavailable
 */
function generateFallbackCards(title: string, rawNotes?: string): GeneratedCard[] {
  const baseCards: GeneratedCard[] = [
    {
      front: `What is ${title}?`,
      back: `${title} is a topic you're studying. Add your own definition to personalize this card.`,
      hint: "Think about the core concept",
      type: "basic",
    },
    {
      front: `What are the key principles of ${title}?`,
      back: "List the main principles or concepts. Edit this card to add your understanding.",
      hint: "Focus on fundamentals",
      type: "basic",
    },
    {
      front: `Why is ${title} important?`,
      back: "Consider real-world applications and significance. Customize this answer.",
      hint: "Think about practical applications",
      type: "basic",
    },
    {
      front: `Explain ${title} in your own words`,
      back: "Try to explain it simply. Replace this with your own explanation.",
      type: "basic",
    },
    {
      front: `What are common misconceptions about ${title}?`,
      back: "Think about what people often get wrong. Edit this card.",
      type: "basic",
    },
    {
      front: `How does ${title} relate to other concepts you know?`,
      back: "Draw connections to build deeper understanding. Customize this card.",
      hint: "Think about related topics",
      type: "basic",
    },
    {
      front: `What are the main components or parts of ${title}?`,
      back: "Break it down into smaller pieces. Add your answer here.",
      type: "basic",
    },
    {
      front: `Give an example of ${title} in practice`,
      back: "Real examples help solidify understanding. Add your own example.",
      hint: "Think of a concrete scenario",
      type: "basic",
    },
  ];

  // If notes are provided, generate some cards from the notes
  if (rawNotes && rawNotes.length > 50) {
    const sentences = rawNotes
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 200);

    const noteCards = sentences.slice(0, 4).map((sentence) => ({
      front: `What does this mean: "${sentence.substring(0, 100)}${sentence.length > 100 ? "..." : ""}"?`,
      back: sentence,
      type: "basic" as const,
    }));

    return [...baseCards.slice(0, 6), ...noteCards].slice(0, 12);
  }

  return baseCards;
}
