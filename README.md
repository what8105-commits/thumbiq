# ThumbIQ

ThumbIQ is a production-ready SaaS starter for YouTube thumbnail intelligence. It searches YouTube for the top 50 videos for a topic or news link, analyzes thumbnails with OpenAI Vision, stores the run in Supabase, scores performance, and renders a modern dashboard with insights and recommendations.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Supabase
- OpenAI API
- YouTube Data API v3

## Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
YOUTUBE_API_KEY=
OPENAI_VISION_MODEL=gpt-4o-mini
```

## Database

Run `supabase/migrations/001_create_thumbiq_tables.sql` in your Supabase project. The app uses the service role key only on the server route and stores:

- `analysis_runs`: topic, aggregate insights, recommendations
- `video_results`: YouTube metadata, thumbnail analysis JSON, performance score

## API

`POST /api/analyze`

```json
{
  "topic": "India Becoming Japan"
}
```

You can also send a news or article URL:

```json
{
  "topic": "https://example.com/news/article"
}
```

For URLs, ThumbIQ extracts article metadata/body content, derives a concise YouTube search query, and analyzes videos based on that content. The response includes `runId`, `source`, analyzed videos, insights, and five thumbnail recommendations.

## Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Architecture

- `app/api/analyze/route.ts`: request validation and orchestration
- `lib/youtube/client.ts`: YouTube Data API integration
- `lib/openai/vision.ts`: OpenAI Vision thumbnail extraction
- `lib/supabase/server.ts`: Supabase persistence
- `lib/analysis/*`: pure scoring, insight, recommendation, and concurrency helpers
- `components/dashboard/*`: client dashboard UI
