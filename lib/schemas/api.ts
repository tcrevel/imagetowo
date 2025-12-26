/**
 * API Response Schemas
 * 
 * Zod schemas for API request/response validation.
 * 
 * @see specs/001-workout-image-to-zwo/contracts/parse.md
 * @see specs/001-workout-image-to-zwo/contracts/export.md
 */

import { z } from "zod";
import { WorkoutSchema } from "./workout";

// ============================================================================
// Parse API Schemas
// ============================================================================

/**
 * ParseResponse - Response from /api/workouts/parse
 * 
 * Constitution Principle II (Honest AI): Includes warnings and confidence
 * to communicate uncertainty transparently.
 */
export const ParseResponseSchema = z.object({
  workout: WorkoutSchema,
  warnings: z.array(z.string()),
  confidence: z
    .number()
    .min(0, "Confidence must be 0-1")
    .max(1, "Confidence must be 0-1"),
});

/**
 * Error codes for programmatic handling
 */
export const ErrorCodeSchema = z.enum([
  "INVALID_IMAGE",
  "PARSE_FAILED",
  "RATE_LIMITED",
  "FILE_TOO_LARGE",
  "INVALID_FORMAT",
  "INTERNAL_ERROR",
]);

/**
 * ParseError - Error response from parsing endpoint
 */
export const ParseErrorSchema = z.object({
  error: z.string(),
  code: ErrorCodeSchema,
  details: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Export API Schemas
// ============================================================================

/**
 * ExportRequest - Request body for /api/workouts/export/zwo
 */
export const ExportRequestSchema = z.object({
  workout: WorkoutSchema,
});

/**
 * ExportResponse - Success response (ZWO XML as string)
 * Note: Actual response is a file download, this is for validation
 */
export const ExportResponseSchema = z.object({
  xml: z.string(),
  filename: z.string(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ParseResponse = z.infer<typeof ParseResponseSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type ParseError = z.infer<typeof ParseErrorSchema>;
export type ExportRequest = z.infer<typeof ExportRequestSchema>;
export type ExportResponse = z.infer<typeof ExportResponseSchema>;

// Re-export for convenience
export { WorkoutSchema } from "./workout";
export type { Workout, Step, StepType } from "./workout";
