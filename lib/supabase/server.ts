import { createClient } from "@supabase/supabase-js";
import type { AnalyzedVideo, ThumbnailRecommendation, TopicInsights } from "@/types/analysis";

export function createSupabaseAdmin(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function persistAnalysisRun({
  supabase,
  topic,
  videos,
  insights,
  recommendations
}: {
  supabase: ReturnType<typeof createSupabaseAdmin>;
  topic: string;
  videos: AnalyzedVideo[];
  insights: TopicInsights;
  recommendations: ThumbnailRecommendation[];
}) {
  const { data: run, error: runError } = await supabase
    .from("analysis_runs")
    .insert({
      topic,
      video_count: videos.length,
      insights,
      recommendations
    })
    .select("id, created_at")
    .single();

  if (runError) {
    throw new Error(`Supabase analysis run insert failed: ${runError.message}`);
  }

  const { error: videoError } = await supabase.from("video_results").insert(
    videos.map((video) => ({
      analysis_run_id: run.id,
      video_id: video.videoId,
      title: video.title,
      channel: video.channel,
      thumbnail_url: video.thumbnail,
      views: video.views,
      published_at: video.publishedAt,
      duration_seconds: video.durationSeconds,
      format: video.format,
      performance_score: video.performanceScore,
      analysis: video.analysis
    }))
  );

  if (videoError) {
    throw new Error(`Supabase video result insert failed: ${videoError.message}`);
  }

  return {
    id: String(run.id),
    createdAt: String(run.created_at)
  };
}
