import { z } from "zod";

/**
 * Environment variable schema with validation
 * Follows Constitution Principle #1: Security-First API
 * - Server-only validation to prevent key exposure
 */
const envSchema = z.object({
  // Required
  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY is required")
    .startsWith("sk-", "OPENAI_API_KEY must start with 'sk-'"),

  // Optional with defaults
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  ALLOWED_IMAGE_FORMATS: z
    .string()
    .default("image/jpeg,image/png,image/webp,image/heic")
    .transform((val) => val.split(",")),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * Only call this on the server side!
 */
function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

// Singleton to avoid re-parsing
let env: Env | null = null;

export function getServerEnv(): Env {
  if (!env) {
    env = getEnv();
  }
  return env;
}

/**
 * Check if we're in development mode
 */
export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}
