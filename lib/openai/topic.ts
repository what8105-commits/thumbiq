import type OpenAI from "openai";
import type { ArticleContent } from "@/lib/content/article";

export async function deriveTopicFromArticle({
  client,
  model,
  article
}: {
  client: OpenAI;
  model: string;
  article: ArticleContent;
}) {
  const fallback = [article.title, article.description]
    .filter(Boolean)
    .join(" ")
    .slice(0, 120);

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You convert article content into concise YouTube search topics for thumbnail research."
        },
        {
          role: "user",
          content: `Create one YouTube search query, max 10 words, based on this article. Return only the query.\n\nURL: ${article.url}\nTitle: ${article.title}\nDescription: ${article.description}\nContent:\n${article.text.slice(0, 3500)}`
        }
      ],
      temperature: 0.2
    });

    const topic = response.choices[0]?.message.content
      ?.replace(/^["']|["']$/g, "")
      .trim();

    return topic && topic.length >= 2 ? topic.slice(0, 120) : fallback;
  } catch {
    return fallback;
  }
}
