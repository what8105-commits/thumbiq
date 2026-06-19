export type ArticleContent = {
  url: string;
  title: string;
  description: string;
  text: string;
};

const USER_AGENT =
  "ThumbIQ/1.0 (+https://localhost) Mozilla/5.0 AppleWebKit/537.36";

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, " "));
}

function getMeta(html: string, names: string[]) {
  for (const name of names) {
    const propertyPattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    );
    const contentFirstPattern = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["'][^>]*>`,
      "i"
    );
    const match = html.match(propertyPattern) ?? html.match(contentFirstPattern);

    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return "";
}

function getTitle(html: string) {
  const metaTitle = getMeta(html, ["og:title", "twitter:title"]);
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "";

  return metaTitle || stripTags(h1) || stripTags(titleTag);
}

function getArticleText(html: string) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const paragraphs = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1]))
    .filter((paragraph) => paragraph.length > 40);

  if (paragraphs.length > 0) {
    return paragraphs.join("\n").slice(0, 6000);
  }

  return stripTags(cleaned).slice(0, 6000);
}

export async function fetchArticleContent(url: string): Promise<ArticleContent> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Could not fetch article URL. Status: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/html")) {
    throw new Error("The provided URL did not return an HTML article page.");
  }

  const html = await response.text();
  const title = getTitle(html);
  const description = getMeta(html, [
    "description",
    "og:description",
    "twitter:description"
  ]);
  const text = getArticleText(html);

  if (!title && !description && text.length < 80) {
    throw new Error("Could not extract enough readable content from the URL.");
  }

  return {
    url,
    title,
    description,
    text
  };
}
