import type {
  AnalyzedVideo,
  FormatStrategy,
  ThumbnailRecommendation,
  TopicInsights
} from "@/types/analysis";

function averageScore(videos: AnalyzedVideo[]) {
  if (videos.length === 0) {
    return 0;
  }

  return Math.round(
    videos.reduce((total, video) => total + video.performanceScore, 0) /
      videos.length
  );
}

function topHook(videos: AnalyzedVideo[]) {
  const hooks = videos.reduce<Record<string, number>>((acc, video) => {
    const hook = video.analysis.hookType || "curiosity";
    acc[hook] = (acc[hook] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(hooks).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "curiosity";
}

function strongestVideo(videos: AnalyzedVideo[]) {
  return [...videos].sort((a, b) => b.performanceScore - a.performanceScore)[0];
}

export function generateFormatStrategy({
  topic,
  videos
}: {
  topic: string;
  videos: AnalyzedVideo[];
}): FormatStrategy {
  const shorts = videos.filter((video) => video.format === "short");
  const longVideos = videos.filter((video) => video.format === "video");
  const shortsAverage = averageScore(shorts);
  const videoAverage = averageScore(longVideos);
  const winningShort = strongestVideo(shorts);
  const winningVideo = strongestVideo(longVideos);
  const recommendedFormat =
    Math.abs(videoAverage - shortsAverage) <= 8
      ? "both"
      : videoAverage > shortsAverage
        ? "video"
        : "short";
  const videoHook = topHook(longVideos.length > 0 ? longVideos : videos);
  const shortsHook = topHook(shorts.length > 0 ? shorts : videos);

  return {
    recommendedFormat,
    summary:
      recommendedFormat === "both"
        ? "This topic has enough signal for both a deep explainer and a short-form hook."
        : recommendedFormat === "video"
          ? "This topic is strongest as a long-form video because the market rewards more context and proof."
          : "This topic is strongest as a Short because the market rewards a fast hook and immediate visual payoff.",
    videoTopic: `${topic}: the full story viewers need to understand`,
    videoThumbnailText:
      videoHook === "evidence" ? "THE PROOF" : videoHook === "stakes" ? "WHAT NEXT?" : "FULL STORY",
    videoVisual:
      "Use one dominant proof object, a clear before-after contrast, and a human reaction cue. Keep the background simple so the promise reads at small size.",
    shortsTopic: `${topic}: the one surprising moment`,
    shortsThumbnailText:
      shortsHook === "emotion" ? "WAIT..." : shortsHook === "transformation" ? "BEFORE / AFTER" : "THIS CHANGED",
    shortsVisual:
      "Use a tight crop, one oversized subject, bright contrast, and a single 1-3 word text hook. The visual should explain the payoff before the title is read.",
    rationale: [
      `Long-form average score: ${videoAverage}/100 across ${longVideos.length} videos.`,
      `Shorts average score: ${shortsAverage}/100 across ${shorts.length} shorts.`,
      winningVideo ? `Top video signal: ${winningVideo.title}` : "No long-form video signal found.",
      winningShort ? `Top Shorts signal: ${winningShort.title}` : "No Shorts signal found."
    ]
  };
}

export function generateRecommendations({
  topic,
  videos,
  insights
}: {
  topic: string;
  videos: AnalyzedVideo[];
  insights: TopicInsights;
}): ThumbnailRecommendation[] {
  const topColors = videos
    .slice()
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .flatMap((video) => video.analysis.colors)
    .slice(0, 5);

  const palette = topColors.length > 0 ? [...new Set(topColors)].slice(0, 3) : ["teal", "amber", "white"];

  return [
    {
      concept: `${topic}: one impossible contrast`,
      hookType: "contrast",
      visualDirection:
        "Split-screen composition with the familiar baseline on the left and the surprising future-state on the right.",
      copy: "THIS CHANGED",
      colors: palette,
      rationale: insights.winningPatterns[0]?.details ?? "Uses a clear curiosity gap."
    },
    {
      concept: `${topic}: human reaction lead`,
      hookType: "emotion",
      visualDirection:
        "Large expressive face in the foreground, simple object cue behind it, and a single oversized word.",
      copy: "WAIT...",
      colors: palette,
      rationale: "Faces and readable emotion create faster viewer interpretation."
    },
    {
      concept: `${topic}: proof artifact`,
      hookType: "evidence",
      visualDirection:
        "Use a chart, map, newspaper crop, or recognizable artifact as the central proof object with a tight crop.",
      copy: "THE DATA",
      colors: palette,
      rationale: "Specific objects make broad topics feel tangible."
    },
    {
      concept: `${topic}: before-after shock`,
      hookType: "transformation",
      visualDirection:
        "Hard diagonal divider, one side muted, one side bright, with the subject crossing the divider.",
      copy: "BEFORE / AFTER",
      colors: palette,
      rationale: "Transformation framing compresses the story into one glance."
    },
    {
      concept: `${topic}: stakes close-up`,
      hookType: "stakes",
      visualDirection:
        "Crop tightly around the most symbolic object, add a clear directional arrow, and keep the background clean.",
      copy: "NEXT?",
      colors: palette,
      rationale: "A single subject with a stakes cue avoids diluted layouts."
    }
  ];
}
