import OpenAI from "openai";
import type { ThumbnailAnalysis, YouTubeVideo } from "@/types/analysis";

const fallbackAnalysis: ThumbnailAnalysis = {
  faces: {
    count: 0,
    description: "No confident face read"
  },
  emotion: "unknown",
  colors: [],
  objects: [],
  layout: "unknown",
  hookType: "unknown",
  textOnImage: [],
  confidence: 0
};

export function createOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

export async function analyzeThumbnail({
  client,
  model,
  video
}: {
  client: OpenAI;
  model: string;
  video: YouTubeVideo;
}): Promise<ThumbnailAnalysis> {
  if (!video.thumbnail) {
    return fallbackAnalysis;
  }

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are ThumbIQ, a YouTube thumbnail strategist. Return only valid JSON."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Analyze this YouTube thumbnail. Return JSON with keys: faces { count number, description string }, emotion string, colors string[], objects string[], layout string, hookType string, textOnImage string[], confidence number from 0 to 1. Focus on visible thumbnail evidence only."
            },
            {
              type: "image_url",
              image_url: {
                url: video.thumbnail,
                detail: "low"
              }
            }
          ]
        }
      ],
      temperature: 0.2
    });

    const raw = response.choices[0]?.message.content;

    if (!raw) {
      return fallbackAnalysis;
    }

    const parsed = JSON.parse(raw) as Partial<ThumbnailAnalysis>;

    return {
      faces: {
        count: Number(parsed.faces?.count ?? 0),
        description: String(parsed.faces?.description ?? "No confident face read")
      },
      emotion: String(parsed.emotion ?? "unknown"),
      colors: Array.isArray(parsed.colors) ? parsed.colors.map(String) : [],
      objects: Array.isArray(parsed.objects) ? parsed.objects.map(String) : [],
      layout: String(parsed.layout ?? "unknown"),
      hookType: String(parsed.hookType ?? "unknown"),
      textOnImage: Array.isArray(parsed.textOnImage)
        ? parsed.textOnImage.map(String)
        : [],
      confidence: Number(parsed.confidence ?? 0)
    };
  } catch {
    return fallbackAnalysis;
  }
}
