export type ViralTopicSuggestion = {
  title: string;
  source: string;
  link: string;
  suggestedTopic: string;
  angle: string;
  publishedAt: string;
};

const GOOGLE_NEWS_RSS =
  "https://news.google.com/rss/topstories?hl=en-IN&gl=IN&ceid=IN:en";

function decodeXml(value: string) {
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

function stripCdata(value: string) {
  return value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function readTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ? decodeXml(stripCdata(match[1])) : "";
}

function toSuggestedTopic(title: string) {
  return title
    .replace(/\s+-\s+[^-]+$/, "")
    .replace(/\s+\|\s+.+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);
}

function toAngle(title: string) {
  const topic = toSuggestedTopic(title);

  if (/launch|announce|release|unveil/i.test(title)) {
    return `${topic}: what changes now?`;
  }

  if (/crisis|war|attack|clash|ban|risk/i.test(title)) {
    return `${topic}: the stakes explained`;
  }

  if (/record|surge|falls|rises|market|stock/i.test(title)) {
    return `${topic}: why it is moving`;
  }

  return `${topic}: the story behind it`;
}

export async function getDailyViralTopicSuggestions() {
  const response = await fetch(GOOGLE_NEWS_RSS, {
    next: { revalidate: 60 * 60 * 6 },
    headers: {
      Accept: "application/rss+xml,text/xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Daily topic feed failed with status ${response.status}`);
  }

  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map((match) => match[1])
    .slice(0, 8);

  return items
    .map<ViralTopicSuggestion>((item) => {
      const title = readTag(item, "title");
      const link = readTag(item, "link");
      const source = readTag(item, "source") || "Google News";

      return {
        title,
        source,
        link,
        suggestedTopic: toSuggestedTopic(title),
        angle: toAngle(title),
        publishedAt: readTag(item, "pubDate")
      };
    })
    .filter((item) => item.title && item.link);
}
