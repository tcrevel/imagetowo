/**
 * Step Zod Schemas
 * 
 * Defines all workout step types as a discriminated union.
 * Each step has a `type` field that determines its shape.
 * 
 * @see specs/001-workout-image-to-zwo/data-model.md
 */

import { z } from "zod";

// ============================================================================
// Step Schemas
// ============================================================================

/**
 * Warmup Step - Gradual power increase from low to high
 */
export const WarmupStepSchema = z.object({
  type: z.literal("warmup"),
  duration_s: z.number().positive("Duration must be positive"),
  power_start_pct: z.number().min(0).max(200, "Power must be 0-200% FTP"),
  power_end_pct: z.number().min(0).max(200, "Power must be 0-200% FTP"),
});

/**
 * Cooldown Step - Gradual power decrease from high to low
 */
export const CooldownStepSchema = z.object({
  type: z.literal("cooldown"),
  duration_s: z.number().positive("Duration must be positive"),
  power_start_pct: z.number().min(0).max(200, "Power must be 0-200% FTP"),
  power_end_pct: z.number().min(0).max(200, "Power must be 0-200% FTP"),
});

/**
 * Steady Step - Constant power for a fixed duration
 */
export const SteadyStepSchema = z.object({
  type: z.literal("steady"),
  duration_s: z.number().positive("Duration must be positive"),
  power_pct: z.number().min(0).max(200, "Power must be 0-200% FTP"),
});

/**
 * Intervals Step - Repeated on/off blocks
 */
export const IntervalsStepSchema = z.object({
  type: z.literal("intervals"),
  repeat: z.number().int().min(1, "At least 1 repetition required"),
  on_duration_s: z.number().positive("On duration must be positive"),
  off_duration_s: z.number().positive("Off duration must be positive"),
  on_power_pct: z.number().min(0).max(200, "Power must be 0-200% FTP"),
  off_power_pct: z.number().min(0).max(200, "Power must be 0-200% FTP"),
});

/**
 * Freeride Step - Unstructured riding time
 * Used as fallback for ambiguous content
 */
export const FreerideStepSchema = z.object({
  type: z.literal("freeride"),
  duration_s: z.number().positive("Duration must be positive"),
});

// ============================================================================
// Discriminated Union
// ============================================================================

/**
 * Step Schema - Discriminated union of all step types
 */
export const StepSchema = z.discriminatedUnion("type", [
  WarmupStepSchema,
  CooldownStepSchema,
  SteadyStepSchema,
  IntervalsStepSchema,
  FreerideStepSchema,
]);

// ============================================================================
// Type Exports
// ============================================================================

export type WarmupStep = z.infer<typeof WarmupStepSchema>;
export type CooldownStep = z.infer<typeof CooldownStepSchema>;
export type SteadyStep = z.infer<typeof SteadyStepSchema>;
export type IntervalsStep = z.infer<typeof IntervalsStepSchema>;
export type FreerideStep = z.infer<typeof FreerideStepSchema>;
export type Step = z.infer<typeof StepSchema>;

/**
 * Type guard for step types
 */
export type StepType = Step["type"];

export const STEP_TYPES = [
  "warmup",
  "cooldown",
  "steady",
  "intervals",
  "freeride",
] as const;
