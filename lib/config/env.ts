import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  YOUTUBE_API_KEY: z.string().min(1),
  OPENAI_VISION_MODEL: z.string().default("gpt-4o-mini")
});

export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL
  });

  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or invalid server environment variables: ${fields}`);
  }

  return parsed.data;
}
