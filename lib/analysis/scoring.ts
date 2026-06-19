import type { AnalyzedVideo, ThumbnailAnalysis, YouTubeVideo } from "@/types/analysis";

function daysSince(date: string) {
  const published = new Date(date).getTime();
  const ageMs = Math.max(Date.now() - published, 24 * 60 * 60 * 1000);
  return ageMs / (24 * 60 * 60 * 1000);
}

function normalize(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.round((value / max) * 100);
}

export function scoreVideos(
  videos: Array<YouTubeVideo & { analysis: ThumbnailAnalysis }>
): AnalyzedVideo[] {
  const velocity = videos.map((video) => video.views / daysSince(video.publishedAt));
  const maxVelocity = Math.max(...velocity, 0);

  return videos.map((video, index) => {
    const baseScore = normalize(velocity[index], maxVelocity);
    const signalBonus =
      Math.min(video.analysis.colors.length, 4) * 2 +
      Math.min(video.analysis.objects.length, 4) * 2 +
      (video.analysis.faces.count > 0 ? 5 : 0) +
      (video.analysis.textOnImage.length > 0 ? 4 : 0);

    return {
      ...video,
      performanceScore: Math.max(1, Math.min(100, baseScore + signalBonus))
    };
  });
}
