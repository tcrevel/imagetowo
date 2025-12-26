/**
 * Workout Zod Schema
 * 
 * Top-level entity representing a complete training session.
 * 
 * @see specs/001-workout-image-to-zwo/data-model.md
 */

import { z } from "zod";
import { StepSchema } from "./step";

// ============================================================================
// Workout Schema
// ============================================================================

/**
 * Workout Schema - Complete training session
 */
export const WorkoutSchema = z.object({
  name: z
    .string()
    .min(1, "Workout name is required")
    .max(100, "Workout name must be 100 characters or less"),
  description: z.string().optional(),
  steps: z
    .array(StepSchema)
    .min(1, "At least one step is required"),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Workout = z.infer<typeof WorkoutSchema>;

// Re-export step types for convenience
export * from "./step";
