import { NextResponse } from "next/server";
import { z } from "zod";
import { generateInsights } from "@/lib/analysis/insights";
import {
  generateFormatStrategy,
  generateRecommendations
} from "@/lib/analysis/recommendations";
import { scoreVideos } from "@/lib/analysis/scoring";
import { mapWithConcurrency } from "@/lib/analysis/concurrency";
import { fetchArticleContent, isHttpUrl } from "@/lib/content/article";
import { getServerEnv } from "@/lib/config/env";
import { deriveTopicFromArticle } from "@/lib/openai/topic";
import { createOpenAIClient, analyzeThumbnail } from "@/lib/openai/vision";
import { createSupabaseAdmin, persistAnalysisRun } from "@/lib/supabase/server";
import { searchYouTubeVideos } from "@/lib/youtube/client";
import type { AnalyzeResponse } from "@/types/analysis";

const analyzeSchema = z.object({
  topic: z.string().trim().min(2).max(2048)
});

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic: input } = analyzeSchema.parse(body);
    const env = getServerEnv();
    const openai = createOpenAIClient(env.OPENAI_API_KEY);
    const source = isHttpUrl(input)
      ? await resolveUrlSource({
          input,
          openai,
          model: env.OPENAI_VISION_MODEL
        })
      : {
          type: "topic" as const,
          input,
          searchQuery: input
        };
    const topic = source.searchQuery;

    const videos = await searchYouTubeVideos(topic, env.YOUTUBE_API_KEY);

    if (videos.length === 0) {
      return NextResponse.json(
        { error: "No YouTube videos were found for this topic." },
        { status: 404 }
      );
    }

    const analyzedThumbnails = await mapWithConcurrency(videos, 5, async (video) => ({
      ...video,
      analysis: await analyzeThumbnail({
        client: openai,
        model: env.OPENAI_VISION_MODEL,
        video
      })
    }));

    const scoredVideos = scoreVideos(analyzedThumbnails).sort(
      (a, b) => b.performanceScore - a.performanceScore
    );
    const insights = generateInsights(scoredVideos);
    const recommendations = generateRecommendations({
      topic,
      videos: scoredVideos,
      insights
    });
    const formatStrategy = generateFormatStrategy({
      topic,
      videos: scoredVideos
    });

    const supabase = createSupabaseAdmin(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    const run = await persistAnalysisRun({
      supabase,
      topic,
      videos: scoredVideos,
      insights,
      recommendations
    });

    const response: AnalyzeResponse = {
      runId: run.id,
      topic,
      source,
      analyzedAt: run.createdAt,
      videos: scoredVideos,
      insights,
      formatStrategy,
      recommendations
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Topic must be between 2 and 120 characters." },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected analysis failure.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function resolveUrlSource({
  input,
  openai,
  model
}: {
  input: string;
  openai: ReturnType<typeof createOpenAIClient>;
  model: string;
}) {
  const article = await fetchArticleContent(input);
  const searchQuery = await deriveTopicFromArticle({
    client: openai,
    model,
    article
  });

  return {
    type: "url" as const,
    input,
    searchQuery,
    articleTitle: article.title,
    articleDescription: article.description
  };
}
