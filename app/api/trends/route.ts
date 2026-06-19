import { NextResponse } from "next/server";
import { getDailyViralTopicSuggestions } from "@/lib/news/trends";

export const runtime = "nodejs";

export async function GET() {
  try {
    const topics = await getDailyViralTopicSuggestions();

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      topics
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load daily topic ideas.";

    return NextResponse.json({ error: message, topics: [] }, { status: 500 });
  }
}
