"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Brain,
  Calendar,
  FileText,
  Gauge,
  Layers3,
  Lightbulb,
  Loader2,
  Palette,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Youtube
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { compactNumber, formatDate } from "@/lib/utils";
import type { AnalyzeResponse, AnalyzedVideo, PatternInsight } from "@/types/analysis";

type RequestState = "idle" | "loading" | "done" | "error";

type DailyTrend = {
  title: string;
  source: string;
  link: string;
  suggestedTopic: string;
  angle: string;
  publishedAt: string;
};

const exampleTopic = "India Becoming Japan";

export function ThumbIQDashboard() {
  const [topic, setTopic] = useState(exampleTopic);
  const [state, setState] = useState<RequestState>("idle");
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [trendsState, setTrendsState] = useState<RequestState>("idle");

  useEffect(() => {
    let isMounted = true;

    async function loadTrends() {
      setTrendsState("loading");

      try {
        const response = await fetch("/api/trends");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load daily ideas");
        }

        if (isMounted) {
          setDailyTrends(payload.topics ?? []);
          setTrendsState("done");
        }
      } catch {
        if (isMounted) {
          setTrendsState("error");
        }
      }
    }

    loadTrends();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    if (!data) {
      return null;
    }

    const shorts = data.videos.filter((video) => video.format === "short");
    const longVideos = data.videos.filter((video) => video.format === "video");
    const averageScore = Math.round(
      data.videos.reduce((total, video) => total + video.performanceScore, 0) /
        Math.max(data.videos.length, 1)
    );
    return {
      averageScore,
      shorts,
      longVideos,
      topVideo: data.videos[0]
    };
  }, [data]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed");
      }

      setData(payload as AnalyzeResponse);
      setState("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed");
      setState("error");
    }
  }

  const hasData = Boolean(data && summary);

  return (
    <main className="min-h-screen">
      <section className="border-b bg-white/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-5 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#ff0033] text-white shadow-sm">
                <Youtube className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-normal">ThumbIQ</h1>
                <p className="text-sm text-muted-foreground">
                  Thumbnail intelligence for high-conviction video decisions
                </p>
              </div>
            </div>
            <div className="flex w-fit shrink-0 items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Research workspace
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="grid gap-2 rounded-lg border bg-card p-2 shadow-soft sm:grid-cols-[1fr_156px]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="h-12 border-0 bg-transparent pl-11 text-base shadow-none focus-visible:ring-0"
                placeholder="Paste a news link or search a YouTube topic"
              />
            </div>
            <Button type="submit" className="h-12 px-5" disabled={state === "loading"}>
              {state === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Analyze
            </Button>
          </form>

          {state === "error" ? (
            <div className="rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-6 md:px-8">
        {hasData && data && summary ? (
          <>
            <RunHeader data={data} />
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                icon={<Target className="h-5 w-5" />}
                label="Total analyzed"
                value={String(data.videos.length)}
              />
              <MetricCard
                icon={<Youtube className="h-5 w-5" />}
                label="Videos"
                value={String(summary.longVideos.length)}
              />
              <MetricCard
                icon={<Layers3 className="h-5 w-5" />}
                label="Shorts"
                value={String(summary.shorts.length)}
              />
              <MetricCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Average score"
                value={`${summary.averageScore}/100`}
              />
            </div>

            <StrategyPanel data={data} />

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <InsightPanel data={data} />
              <RecommendationPanel data={data} />
            </div>

            <div className="grid gap-5">
              <VideoTable
                title="Videos"
                description="Long-form results separated from Shorts for cleaner creative comparison."
                videos={summary.longVideos}
                emptyLabel="No long-form videos found in this run."
              />
              <VideoTable
                title="Shorts"
                description="Short-form results under 3 minutes, ranked by the same thumbnail performance model."
                videos={summary.shorts}
                emptyLabel="No Shorts found in this run."
              />
            </div>
          </>
        ) : (
          <EmptyState isLoading={state === "loading"} />
        )}
        <DailyTrendPanel
          trends={dailyTrends}
          state={trendsState}
          onUseTopic={setTopic}
        />
      </section>
    </main>
  );
}

function StrategyPanel({ data }: { data: AnalyzeResponse }) {
  const strategy = data.formatStrategy;
  const formatLabel =
    strategy.recommendedFormat === "both"
      ? "Video + Shorts"
      : strategy.recommendedFormat === "video"
        ? "Video first"
        : "Shorts first";

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-slate-950 p-5 text-white">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
              <Lightbulb className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-white/55">Recommended direction</p>
              <h3 className="text-2xl font-bold">{formatLabel}</h3>
            </div>
          </div>
          <p className="text-sm leading-6 text-white/72">{strategy.summary}</p>
          <div className="mt-5 grid gap-2">
            {strategy.rationale.map((reason) => (
              <div
                key={reason}
                className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white/75"
              >
                {reason}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <FormatBrief
            label="Best video topic"
            topic={strategy.videoTopic}
            thumbnailText={strategy.videoThumbnailText}
            visual={strategy.videoVisual}
          />
          <FormatBrief
            label="Best Shorts topic"
            topic={strategy.shortsTopic}
            thumbnailText={strategy.shortsThumbnailText}
            visual={strategy.shortsVisual}
          />
        </div>
      </div>
    </Card>
  );
}

function FormatBrief({
  label,
  topic,
  thumbnailText,
  visual
}: {
  label: string;
  topic: string;
  thumbnailText: string;
  visual: string;
}) {
  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <h3 className="mt-2 font-semibold leading-snug">{topic}</h3>
      <div className="mt-4 grid gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Thumbnail text</p>
          <Badge className="mt-1 bg-secondary/15 text-secondary-foreground">
            {thumbnailText}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Visual direction</p>
          <p className="mt-1 text-sm leading-6">{visual}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="h-1 bg-primary" />
      <CardContent className="flex items-center gap-4 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RunHeader({ data }: { data: AnalyzeResponse }) {
  const shortsCount = data.videos.filter((video) => video.format === "short").length;
  const videoCount = data.videos.length - shortsCount;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="bg-foreground text-white">
            {data.source.type === "url" ? "Article brief" : "Topic brief"}
          </Badge>
          <Badge>{videoCount} videos</Badge>
          <Badge>{shortsCount} shorts</Badge>
        </div>
        <h2 className="truncate text-xl font-bold">{data.topic}</h2>
        {data.source.type === "url" ? (
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {data.source.articleTitle || data.source.input}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm md:w-72">
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-muted-foreground">Run ID</p>
          <p className="truncate font-medium">{data.runId}</p>
        </div>
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-muted-foreground">Analyzed</p>
          <p className="font-medium">{formatDate(data.analyzedAt)}</p>
        </div>
      </div>
    </div>
  );
}

function InsightPanel({ data }: { data: AnalyzeResponse }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          Insights for {data.topic}
        </CardTitle>
        <CardDescription>
          {data.source.type === "url"
            ? `Derived from: ${data.source.articleTitle || data.source.input}`
            : "Patterns distilled from the top 50 YouTube thumbnails and performance signals."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <InsightGroup title="Winning Patterns" items={data.insights.winningPatterns} />
        <InsightGroup title="Color Analysis" items={data.insights.colorAnalysis} />
        <InsightGroup title="Emotion Analysis" items={data.insights.emotionAnalysis} />
        <InsightGroup title="Layout Analysis" items={data.insights.layoutAnalysis} />
        <InsightGroup title="Losing Patterns" items={data.insights.losingPatterns} />
      </CardContent>
    </Card>
  );
}

function InsightGroup({ title, items }: { title: string; items: PatternInsight[] }) {
  return (
    <div className="rounded-md border bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h3>
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={`${title}-${item.title}`} className="grid gap-1">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationPanel({ data }: { data: AnalyzeResponse }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-accent" />
          Thumbnail Recommendations
        </CardTitle>
        <CardDescription>Five creative directions generated from the winning set.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {data.recommendations.map((recommendation, index) => (
          <div key={recommendation.concept} className="rounded-md border bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Concept {index + 1}</p>
                <h3 className="font-semibold">{recommendation.concept}</h3>
              </div>
              <Badge>{recommendation.hookType}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{recommendation.visualDirection}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-secondary/15 text-secondary-foreground">
                {recommendation.copy}
              </Badge>
              {recommendation.colors.map((color) => (
                <Badge key={`${recommendation.concept}-${color}`}>{color}</Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds: number) {
  if (!seconds) {
    return "unknown length";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function VideoTable({
  title,
  description,
  videos,
  emptyLabel
}: {
  title: string;
  description: string;
  videos: AnalyzedVideo[];
  emptyLabel: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {videos.length > 0 ? (
          <div className="grid gap-3">
            {videos.map((video) => (
            <article
              key={video.videoId}
              className="grid gap-4 rounded-md border bg-white p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.015] md:grid-cols-[168px_1fr_180px]"
            >
              <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                {video.thumbnail ? (
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    sizes="168px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <h3 className="line-clamp-2 font-semibold">{video.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{video.channel}</span>
                  <span>{compactNumber(video.views)} views</span>
                  <span>{formatDuration(video.durationSeconds)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(video.publishedAt)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{video.analysis.hookType}</Badge>
                  <Badge>{video.analysis.emotion}</Badge>
                  <Badge>{video.analysis.layout}</Badge>
                </div>
              </div>
              <div className="grid content-center gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="font-semibold">{video.performanceScore}/100</span>
                </div>
                <Progress value={video.performanceScore} />
                <p className="text-xs text-muted-foreground">
                  Text: {video.analysis.textOnImage.slice(0, 2).join(", ") || "none detected"}
                </p>
              </div>
            </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-muted/35 px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DailyTrendPanel({
  trends,
  state,
  onUseTopic
}: {
  trends: DailyTrend[];
  state: RequestState;
  onUseTopic: (topic: string) => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            Daily Viral Topic Ideas
          </CardTitle>
          <CardDescription>
            Fresh news-led topics with source links, updated throughout the day.
          </CardDescription>
        </div>
        <Badge className="w-fit">
          {state === "loading" ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Updating
            </>
          ) : (
            "Daily feed"
          )}
        </Badge>
      </CardHeader>
      <CardContent>
        {state === "error" ? (
          <div className="rounded-md border bg-muted/35 px-4 py-8 text-center text-sm text-muted-foreground">
            Daily topic ideas could not be loaded right now.
          </div>
        ) : null}

        {state !== "error" ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {(trends.length > 0 ? trends : Array.from({ length: 4 })).map(
              (trend, index) =>
                trend ? (
                  <article
                    key={trend.link}
                    className="grid gap-3 rounded-md border bg-white p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {trend.source}
                        </p>
                        <h3 className="mt-1 line-clamp-2 font-semibold">
                          {trend.suggestedTopic}
                        </h3>
                      </div>
                      <Badge>{index + 1}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {trend.angle}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onUseTopic(trend.suggestedTopic)}
                      >
                        Use topic
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <a href={trend.link} target="_blank" rel="noreferrer">
                          Source link
                        </a>
                      </Button>
                    </div>
                  </article>
                ) : (
                  <div
                    key={`trend-skeleton-${index}`}
                    className="h-40 animate-pulse rounded-md border bg-muted/40"
                  />
                )
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmptyState({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="grid min-h-[500px] overflow-hidden rounded-lg border bg-white shadow-soft lg:grid-cols-[0.95fr_1.05fr]">
      <div className="flex items-center p-8 md:p-10">
        <div className="max-w-xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-white">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </div>
          <h2 className="text-3xl font-bold tracking-normal">
            {isLoading ? "Building the intelligence brief" : "Start a thumbnail intelligence run"}
          </h2>
          <p className="mt-3 max-w-lg text-base leading-7 text-muted-foreground">
            {isLoading
              ? "Collecting market examples, scoring visual patterns, and preparing recommendations."
              : "Benchmark a topic or article against the videos already competing for attention."}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SignalPill icon={<Gauge className="h-4 w-4" />} label="Performance" />
            <SignalPill icon={<Layers3 className="h-4 w-4" />} label="Patterns" />
            <SignalPill icon={<FileText className="h-4 w-4" />} label="Concepts" />
          </div>
        </div>
      </div>
      <div className="border-t bg-slate-950 p-6 text-white lg:border-l lg:border-t-0">
        <div className="grid h-full content-center gap-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/55">Market signal</p>
                <p className="text-xl font-semibold">Visual patterns</p>
              </div>
              <Badge className="border-white/10 bg-white/10 text-white">Live</Badge>
            </div>
            <div className="grid gap-3">
              <PreviewRow label="High contrast composition" value={82} />
              <PreviewRow label="Human emotion cue" value={74} />
              <PreviewRow label="Short text hook" value={68} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-sm text-white/55">Recommendation set</p>
              <p className="mt-2 text-3xl font-bold">5</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-sm text-white/55">Research depth</p>
              <p className="mt-2 text-3xl font-bold">50</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium shadow-sm">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-white/75">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-secondary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
