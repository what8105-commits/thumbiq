import type { YouTubeVideo } from "@/types/analysis";

type SearchItem = {
  id?: { videoId?: string };
};

type VideoItem = {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: Record<string, { url: string }>;
  };
  statistics?: {
    viewCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
};

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

function parseYouTubeDuration(duration: string) {
  const match = duration.match(
    /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
  );

  if (!match) {
    return 0;
  }

  const [, days, hours, minutes, seconds] = match;

  return (
    Number(days ?? 0) * 86400 +
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  );
}

export async function searchYouTubeVideos(topic: string, apiKey: string) {
  const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "50");
  searchUrl.searchParams.set("order", "relevance");
  searchUrl.searchParams.set("q", topic);
  searchUrl.searchParams.set("key", apiKey);

  const searchResponse = await fetch(searchUrl, { next: { revalidate: 3600 } });

  if (!searchResponse.ok) {
    throw new Error(`YouTube search failed with status ${searchResponse.status}`);
  }

  const searchData = (await searchResponse.json()) as { items?: SearchItem[] };
  const ids = (searchData.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) {
    return [];
  }

  const videosUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
  videosUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  videosUrl.searchParams.set("id", ids.join(","));
  videosUrl.searchParams.set("key", apiKey);

  const videosResponse = await fetch(videosUrl, { next: { revalidate: 3600 } });

  if (!videosResponse.ok) {
    throw new Error(`YouTube video lookup failed with status ${videosResponse.status}`);
  }

  const videosData = (await videosResponse.json()) as { items?: VideoItem[] };

  return (videosData.items ?? []).map<YouTubeVideo>((item) => {
    const durationSeconds = parseYouTubeDuration(item.contentDetails?.duration ?? "");

    return {
      videoId: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnail:
        item.snippet.thumbnails.maxres?.url ??
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        "",
      views: Number(item.statistics?.viewCount ?? 0),
      durationSeconds,
      format: durationSeconds > 0 && durationSeconds < 180 ? "short" : "video"
    };
  });
}
