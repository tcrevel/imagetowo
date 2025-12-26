/**
 * ZWO Generator Service
 * 
 * Converts canonical Workout JSON to Zwift .zwo XML format.
 * 
 * Constitution Principle III: Valid Export
 * - XML escaping for special characters
 * - Proper power conversion (% to decimal)
 * - Valid ZWO structure
 * 
 * @see specs/001-workout-image-to-zwo/contracts/export.md
 */

import type { Workout, Step } from "@/lib/schemas";

// ============================================================================
// Constants
// ============================================================================

const ZWO_AUTHOR = "ImageToFit";
const ZWO_SPORT_TYPE = "bike";

// ============================================================================
// XML Utilities
// ============================================================================

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Convert percentage (0-200) to ZWO decimal (0.00-2.00)
 */
function powerToDecimal(pct: number): string {
  return (pct / 100).toFixed(2);
}

// ============================================================================
// Step Generators
// ============================================================================

function generateWarmup(step: Extract<Step, { type: "warmup" }>): string {
  return `    <Warmup Duration="${step.duration_s}" PowerLow="${powerToDecimal(step.power_start_pct)}" PowerHigh="${powerToDecimal(step.power_end_pct)}"/>`;
}

function generateCooldown(step: Extract<Step, { type: "cooldown" }>): string {
  return `    <Cooldown Duration="${step.duration_s}" PowerLow="${powerToDecimal(step.power_start_pct)}" PowerHigh="${powerToDecimal(step.power_end_pct)}"/>`;
}

function generateSteady(step: Extract<Step, { type: "steady" }>): string {
  return `    <SteadyState Duration="${step.duration_s}" Power="${powerToDecimal(step.power_pct)}"/>`;
}

function generateIntervals(step: Extract<Step, { type: "intervals" }>): string {
  return `    <IntervalsT Repeat="${step.repeat}" OnDuration="${step.on_duration_s}" OffDuration="${step.off_duration_s}" OnPower="${powerToDecimal(step.on_power_pct)}" OffPower="${powerToDecimal(step.off_power_pct)}"/>`;
}

function generateFreeride(step: Extract<Step, { type: "freeride" }>): string {
  return `    <FreeRide Duration="${step.duration_s}"/>`;
}

/**
 * Generate ZWO XML element for a single step
 */
function stepToZwoElement(step: Step): string {
  switch (step.type) {
    case "warmup":
      return generateWarmup(step);
    case "cooldown":
      return generateCooldown(step);
    case "steady":
      return generateSteady(step);
    case "intervals":
      return generateIntervals(step);
    case "freeride":
      return generateFreeride(step);
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = step;
      throw new Error(`Unknown step type: ${(_exhaustive as Step).type}`);
  }
}

// ============================================================================
// Main Generator
// ============================================================================

/**
 * Convert a Workout to ZWO XML format
 */
export function workoutToZwo(workout: Workout): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<workout_file>",
    `  <author>${ZWO_AUTHOR}</author>`,
    `  <name>${escapeXml(workout.name)}</name>`,
  ];

  // Add description if present
  if (workout.description) {
    lines.push(`  <description>${escapeXml(workout.description)}</description>`);
  }

  lines.push(`  <sportType>${ZWO_SPORT_TYPE}</sportType>`);
  lines.push("  <workout>");

  // Generate step elements
  for (const step of workout.steps) {
    lines.push(stepToZwoElement(step));
  }

  lines.push("  </workout>");
  lines.push("</workout_file>");

  return lines.join("\n");
}

// ============================================================================
// Filename Generation
// ============================================================================

/**
 * Generate a safe filename from workout name
 * 
 * 1. Convert to lowercase
 * 2. Replace spaces with hyphens
 * 3. Remove special characters
 * 4. Append .zwo extension
 */
export function generateZwoFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "workout"}.zwo`;
}
