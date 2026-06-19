import type { AnalyzedVideo, PatternInsight, TopicInsights } from "@/types/analysis";

function topByScore(videos: AnalyzedVideo[]) {
  return [...videos].sort((a, b) => b.performanceScore - a.performanceScore);
}

function count(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    const key = value.trim().toLowerCase();
    if (key) {
      acc[key] = (acc[key] ?? 0) + 1;
    }

    return acc;
  }, {});
}

function topEntries(values: string[], limit = 3) {
  return Object.entries(count(values))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, amount]) => `${key} (${amount})`);
}

function pattern(title: string, details: string, evidence: string[]): PatternInsight {
  return { title, details, evidence };
}

export function generateInsights(videos: AnalyzedVideo[]): TopicInsights {
  const ranked = topByScore(videos);
  const winners = ranked.slice(0, Math.max(3, Math.ceil(ranked.length * 0.2)));
  const losers = ranked.slice(-Math.max(3, Math.ceil(ranked.length * 0.2)));

  const winnerColors = topEntries(winners.flatMap((video) => video.analysis.colors));
  const loserColors = topEntries(losers.flatMap((video) => video.analysis.colors));
  const winnerEmotions = topEntries(winners.map((video) => video.analysis.emotion));
  const winnerLayouts = topEntries(winners.map((video) => video.analysis.layout));
  const loserLayouts = topEntries(losers.map((video) => video.analysis.layout));
  const winnerHooks = topEntries(winners.map((video) => video.analysis.hookType));

  return {
    winningPatterns: [
      pattern(
        "High performers make the promise obvious",
        `Top thumbnails over-index on ${winnerHooks.join(", ") || "clear visual hooks"}.`,
        winners.slice(0, 5).map((video) => video.title)
      ),
      pattern(
        "Human signal increases stopping power",
        `${winners.filter((video) => video.analysis.faces.count > 0).length} of ${winners.length} top thumbnails include a visible face.`,
        winners
          .filter((video) => video.analysis.faces.count > 0)
          .slice(0, 5)
          .map((video) => video.title)
      )
    ],
    losingPatterns: [
      pattern(
        "Weak thumbnails hide the contrast",
        `Lower performers skew toward ${loserLayouts.join(", ") || "unclear compositions"}.`,
        losers.slice(0, 5).map((video) => video.title)
      )
    ],
    colorAnalysis: [
      pattern(
        "Winning color set",
        `The strongest recurring colors are ${winnerColors.join(", ") || "not yet conclusive"}.`,
        winners.slice(0, 5).map((video) => video.title)
      ),
      pattern(
        "Color risks",
        `Lower performers repeat ${loserColors.join(", ") || "no strong color pattern"}.`,
        losers.slice(0, 5).map((video) => video.title)
      )
    ],
    emotionAnalysis: [
      pattern(
        "Emotional posture",
        `Top thumbnails most often signal ${winnerEmotions.join(", ") || "curiosity or urgency"}.`,
        winners.slice(0, 5).map((video) => video.title)
      )
    ],
    layoutAnalysis: [
      pattern(
        "Layout direction",
        `Winning layouts cluster around ${winnerLayouts.join(", ") || "simple focal hierarchy"}.`,
        winners.slice(0, 5).map((video) => video.title)
      )
    ]
  };
}
