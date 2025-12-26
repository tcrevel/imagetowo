/**
 * POST /api/workouts/export/zwo
 * 
 * Convert a workout JSON to ZWO XML format.
 * 
 * Constitution Principle III: Valid Export
 * - Zod validation of input
 * - Proper XML escaping
 * - Valid ZWO structure
 * 
 * @see specs/001-workout-image-to-zwo/contracts/export.md
 */

import { NextRequest, NextResponse } from "next/server";
import { WorkoutSchema } from "@/lib/schemas";
import { workoutToZwo, generateZwoFilename } from "@/lib/services/zwo";

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate workout structure
    const parsed = WorkoutSchema.safeParse(body.workout ?? body);
    
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstError?.message || "Invalid workout structure",
          code: "VALIDATION_ERROR",
          details: {
            path: firstError?.path.join("."),
            message: firstError?.message,
          },
        },
        { status: 400 }
      );
    }
    
    const workout = parsed.data;
    
    // Generate ZWO XML
    const xml = workoutToZwo(workout);
    const filename = generateZwoFilename(workout.name);
    
    // Return as XML file download
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
