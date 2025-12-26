/**
 * OpenAI Service
 * 
 * Server-side only - handles communication with OpenAI GPT-4 Vision API.
 * 
 * Constitution Principle I: Security-First API
 * - API key never exposed to client
 * - Server-side only execution
 * 
 * Constitution Principle II: Honest AI
 * - Reports confidence scores
 * - Includes warnings for ambiguous content
 * 
 * @see specs/001-workout-image-to-zwo/contracts/parse.md
 */

import OpenAI from "openai";
import { getServerEnv } from "@/lib/utils/env";
import type { Workout, ParseResponse } from "@/lib/schemas";
import { WorkoutSchema } from "@/lib/schemas";

// ============================================================================
// Types
// ============================================================================

export interface ParseOptions {
  /** User's FTP for converting absolute watts to percentage */
  ftp?: number;
  /** Language hint for parsing */
  locale?: string;
  /** Additional context to help parsing */
  notes?: string;
}

interface OpenAIWorkoutResponse {
  name: string;
  description?: string;
  steps: Array<{
    type: "warmup" | "cooldown" | "steady" | "intervals" | "freeride";
    duration_s: number;
    power_start_pct?: number;
    power_end_pct?: number;
    power_pct?: number;
    repeat?: number;
    on_duration_s?: number;
    off_duration_s?: number;
    on_power_pct?: number;
    off_power_pct?: number;
  }>;
  warnings: string[];
  confidence: number;
}

// ============================================================================
// OpenAI Client (Singleton)
// ============================================================================

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const env = getServerEnv();
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are a cycling workout analyzer. You analyze images of cycling workouts and extract structured data.

Your output MUST be valid JSON matching this exact schema:
{
  "name": "string (workout name, max 100 chars)",
  "description": "string (optional description)",
  "steps": [
    // Each step must be one of these types:
    
    // Warmup - ONLY for smooth gradual ramps (power changes continuously over time)
    { "type": "warmup", "duration_s": number, "power_start_pct": number, "power_end_pct": number }
    
    // Cooldown - ONLY for smooth gradual ramps down
    { "type": "cooldown", "duration_s": number, "power_start_pct": number, "power_end_pct": number }
    
    // Steady - constant power for a fixed duration (USE THIS for progressive warmup blocks!)
    { "type": "steady", "duration_s": number, "power_pct": number }
    
    // Intervals - repeated on/off blocks with same duration/power each time
    { "type": "intervals", "repeat": number, "on_duration_s": number, "off_duration_s": number, "on_power_pct": number, "off_power_pct": number }
    
    // Freeride - unstructured (use when content is unclear)
    { "type": "freeride", "duration_s": number }
  ],
  "warnings": ["array of warning messages for any ambiguous content"],
  "confidence": number // 0.0 to 1.0, your confidence in the parsing accuracy
}

CRITICAL RULES:
1. Power values are percentages of FTP (0-200)
2. Duration values are in seconds
3. IMPORTANT: If a warmup consists of SEPARATE BLOCKS at different power levels (e.g., "4' 60%, 3' 70%, 3' 80%, 2' 90%"), 
   create MULTIPLE "steady" steps, NOT a single "warmup" step!
   Only use "warmup" type for smooth continuous ramps.
4. IMPORTANT: If intervals have DIFFERENT durations or powers each time, use separate "steady" steps, not "intervals" type.
   Only use "intervals" type when all repetitions have the SAME on/off duration and power.
5. If you can't read something clearly, add a warning and make your best estimate
6. If a section is completely illegible, use "freeride" type with estimated duration
7. Be conservative with confidence scores - lower if image quality is poor or text is unclear
8. Always return valid JSON, never explanatory text

Example: "4' 60%, 3' 70%, 3' 80%" should become:
[
  { "type": "steady", "duration_s": 240, "power_pct": 60 },
  { "type": "steady", "duration_s": 180, "power_pct": 70 },
  { "type": "steady", "duration_s": 180, "power_pct": 80 }
]
NOT a single warmup step!`;

// ============================================================================
// Parse Function
// ============================================================================

/**
 * Parse a workout image using OpenAI GPT-4 Vision
 * 
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @param options - Optional parsing configuration
 * @returns ParseResponse with workout, warnings, and confidence
 */
export async function parseWorkoutImage(
  imageBase64: string,
  mimeType: string,
  options: ParseOptions = {}
): Promise<ParseResponse> {
  const openai = getOpenAI();

  // Build user prompt with optional context
  let userPrompt = "Analyze this cycling workout image and extract the structured workout data.";
  
  if (options.ftp) {
    userPrompt += ` The user's FTP is ${options.ftp} watts - convert any absolute watt values to percentages.`;
  }
  
  if (options.locale && options.locale !== "en") {
    userPrompt += ` The workout text may be in ${options.locale}.`;
  }
  
  if (options.notes) {
    userPrompt += ` Additional context: ${options.notes}`;
  }

  userPrompt += "\n\nRespond ONLY with the JSON object, no other text.";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent structured output
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse JSON response
    const parsed = parseJsonResponse(content);
    
    // Validate against our schema
    const validatedWorkout = WorkoutSchema.safeParse(parsed);
    
    if (!validatedWorkout.success) {
      // Add validation errors as warnings
      const warnings = [
        ...parsed.warnings,
        "Some parsed data required adjustment to match schema",
      ];
      
      // Attempt to fix common issues
      const fixedWorkout = fixWorkoutData(parsed);
      
      return {
        workout: fixedWorkout,
        warnings,
        confidence: Math.min(parsed.confidence, 0.6), // Lower confidence due to fixes
      };
    }

    return {
      workout: validatedWorkout.data,
      warnings: parsed.warnings || [],
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to parse workout: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse JSON from OpenAI response, handling potential formatting issues
 */
function parseJsonResponse(content: string): OpenAIWorkoutResponse {
  // Remove potential markdown code fences
  let cleaned = content.trim();
  
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse OpenAI response as JSON");
  }
}

/**
 * Attempt to fix common issues in parsed workout data
 */
function fixWorkoutData(data: OpenAIWorkoutResponse): Workout {
  return {
    name: data.name?.slice(0, 100) || "Untitled Workout",
    description: data.description,
    steps: data.steps.map((step) => {
      // Ensure all values are within bounds
      const clampPower = (val: number | undefined, def: number) => 
        Math.max(0, Math.min(200, val ?? def));
      
      const clampDuration = (val: number | undefined, def: number) =>
        Math.max(1, val ?? def);

      switch (step.type) {
        case "warmup":
          return {
            type: "warmup" as const,
            duration_s: clampDuration(step.duration_s, 300),
            power_start_pct: clampPower(step.power_start_pct, 50),
            power_end_pct: clampPower(step.power_end_pct, 75),
          };
        case "cooldown":
          return {
            type: "cooldown" as const,
            duration_s: clampDuration(step.duration_s, 300),
            power_start_pct: clampPower(step.power_start_pct, 70),
            power_end_pct: clampPower(step.power_end_pct, 40),
          };
        case "steady":
          return {
            type: "steady" as const,
            duration_s: clampDuration(step.duration_s, 300),
            power_pct: clampPower(step.power_pct, 75),
          };
        case "intervals":
          return {
            type: "intervals" as const,
            repeat: Math.max(1, step.repeat ?? 1),
            on_duration_s: clampDuration(step.on_duration_s, 60),
            off_duration_s: clampDuration(step.off_duration_s, 60),
            on_power_pct: clampPower(step.on_power_pct, 100),
            off_power_pct: clampPower(step.off_power_pct, 50),
          };
        case "freeride":
        default:
          return {
            type: "freeride" as const,
            duration_s: clampDuration(step.duration_s, 300),
          };
      }
    }),
  };
}
