export type YouTubeVideo = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: number;
  publishedAt: string;
  durationSeconds: number;
  format: "short" | "video";
};

export type ThumbnailAnalysis = {
  faces: {
    count: number;
    description: string;
  };
  emotion: string;
  colors: string[];
  objects: string[];
  layout: string;
  hookType: string;
  textOnImage: string[];
  confidence: number;
};

export type AnalyzedVideo = YouTubeVideo & {
  analysis: ThumbnailAnalysis;
  performanceScore: number;
};

export type PatternInsight = {
  title: string;
  details: string;
  evidence: string[];
};

export type TopicInsights = {
  winningPatterns: PatternInsight[];
  losingPatterns: PatternInsight[];
  colorAnalysis: PatternInsight[];
  emotionAnalysis: PatternInsight[];
  layoutAnalysis: PatternInsight[];
};

export type ThumbnailRecommendation = {
  concept: string;
  hookType: string;
  visualDirection: string;
  copy: string;
  colors: string[];
  rationale: string;
};

export type FormatStrategy = {
  recommendedFormat: "video" | "short" | "both";
  summary: string;
  videoTopic: string;
  videoThumbnailText: string;
  videoVisual: string;
  shortsTopic: string;
  shortsThumbnailText: string;
  shortsVisual: string;
  rationale: string[];
};

export type AnalyzeSource = {
  type: "topic" | "url";
  input: string;
  searchQuery: string;
  articleTitle?: string;
  articleDescription?: string;
};

export type AnalyzeResponse = {
  runId: string;
  topic: string;
  source: AnalyzeSource;
  analyzedAt: string;
  videos: AnalyzedVideo[];
  insights: TopicInsights;
  formatStrategy: FormatStrategy;
  recommendations: ThumbnailRecommendation[];
};
