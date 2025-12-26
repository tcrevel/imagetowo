/**
 * POST /api/workouts/parse
 * 
 * Parse a workout image using GPT-4 Vision.
 * 
 * Constitution Principle I: Security-First API
 * - Server-side only OpenAI calls
 * - File validation before processing
 * 
 * Constitution Principle II: Honest AI
 * - Returns confidence scores
 * - Includes warnings for ambiguous content
 * 
 * @see specs/001-workout-image-to-zwo/contracts/parse.md
 */

import { NextRequest, NextResponse } from "next/server";
import { parseWorkoutImage } from "@/lib/services/openai";
import { getServerEnv } from "@/lib/utils/env";
import type { ParseError } from "@/lib/schemas";

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    
    // Validate file presence
    if (!file || !(file instanceof File)) {
      return errorResponse("No file provided", "INVALID_IMAGE", 400);
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        `Invalid file type. Accepted: ${ALLOWED_TYPES.join(", ")}`,
        "INVALID_FORMAT",
        400
      );
    }
    
    // Validate file size
    if (file.size > env.MAX_FILE_SIZE) {
      return errorResponse(
        `File too large. Maximum size: ${Math.round(env.MAX_FILE_SIZE / 1024 / 1024)}MB`,
        "FILE_TOO_LARGE",
        413
      );
    }
    
    // Get optional parameters
    const ftpStr = formData.get("ftp");
    const ftp = ftpStr ? parseInt(ftpStr.toString(), 10) : undefined;
    const locale = formData.get("locale")?.toString();
    const notes = formData.get("notes")?.toString();
    
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    
    // Parse with OpenAI
    const result = await parseWorkoutImage(base64, file.type, {
      ftp: ftp && !isNaN(ftp) ? ftp : undefined,
      locale,
      notes,
    });
    
    // Return appropriate status based on confidence
    const status = result.confidence < 0.5 ? 422 : 200;
    
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("Parse error:", error);
    
    if (error instanceof Error) {
      return errorResponse(error.message, "PARSE_FAILED", 500);
    }
    
    return errorResponse("An unexpected error occurred", "INTERNAL_ERROR", 500);
  }
}

// ============================================================================
// Helpers
// ============================================================================

function errorResponse(
  message: string,
  code: ParseError["code"],
  status: number
): NextResponse {
  return NextResponse.json(
    { error: message, code } satisfies ParseError,
    { status }
  );
}
