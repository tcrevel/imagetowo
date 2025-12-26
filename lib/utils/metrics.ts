/**
 * TSS/IF Calculator
 * 
 * Calculates Training Stress Score (TSS) and Intensity Factor (IF)
 * for structured workouts.
 * 
 * Formulas:
 * - IF = NP / FTP
 * - TSS = (duration_s × NP × IF) / (FTP × 3600) × 100
 * 
 * For structured workouts, we estimate NP from the power targets.
 */

import type { Workout, Step } from "@/lib/schemas";

export interface WorkoutMetrics {
  totalDuration: number;     // seconds
  normalizedPower: number;   // watts (estimated)
  intensityFactor: number;   // decimal (0-2)
  tss: number;               // Training Stress Score
  averagePower: number;      // watts (estimated)
}

/**
 * Get the average power for a step (in % FTP)
 */
function getStepAveragePower(step: Step): number {
  switch (step.type) {
    case "warmup":
    case "cooldown":
      // Average of ramp
      return (step.power_start_pct + step.power_end_pct) / 2;
    case "steady":
      return step.power_pct;
    case "intervals":
      // Weighted average of on/off
      const totalTime = step.on_duration_s + step.off_duration_s;
      return (
        (step.on_power_pct * step.on_duration_s +
          step.off_power_pct * step.off_duration_s) /
        totalTime
      );
    case "freeride":
      return 60; // Assume Z2 for freeride
    default:
      return 0;
  }
}

/**
 * Get the duration of a step in seconds
 */
function getStepDuration(step: Step): number {
  if (step.type === "intervals") {
    return (step.on_duration_s + step.off_duration_s) * step.repeat;
  }
  return step.duration_s;
}

/**
 * Calculate estimated Normalized Power for a workout
 * 
 * For structured workouts, we use a simplified calculation:
 * - Weight higher intensities more (4th power averaging approximation)
 * - This gives a reasonable NP estimate without actual power data
 */
function calculateNormalizedPower(steps: Step[], ftp: number): number {
  if (steps.length === 0) return 0;

  let weightedPowerSum = 0;
  let totalDuration = 0;

  for (const step of steps) {
    const duration = getStepDuration(step);
    const avgPowerPct = getStepAveragePower(step);
    const avgPowerWatts = (avgPowerPct / 100) * ftp;

    // For intervals, account for variability with a boost factor
    let variabilityFactor = 1.0;
    if (step.type === "intervals") {
      const onPower = (step.on_power_pct / 100) * ftp;
      const offPower = (step.off_power_pct / 100) * ftp;
      const diff = Math.abs(onPower - offPower);
      // Higher variability = higher NP relative to average
      variabilityFactor = 1 + (diff / ftp) * 0.1;
    }

    // Use 4th power weighting (simplified)
    const weightedPower = Math.pow(avgPowerWatts * variabilityFactor, 4);
    weightedPowerSum += weightedPower * duration;
    totalDuration += duration;
  }

  if (totalDuration === 0) return 0;

  // 4th root of average of 4th powers
  return Math.pow(weightedPowerSum / totalDuration, 0.25);
}

/**
 * Calculate average power for a workout
 */
function calculateAveragePower(steps: Step[], ftp: number): number {
  if (steps.length === 0) return 0;

  let powerSum = 0;
  let totalDuration = 0;

  for (const step of steps) {
    const duration = getStepDuration(step);
    const avgPowerPct = getStepAveragePower(step);
    const avgPowerWatts = (avgPowerPct / 100) * ftp;

    powerSum += avgPowerWatts * duration;
    totalDuration += duration;
  }

  if (totalDuration === 0) return 0;
  return powerSum / totalDuration;
}

/**
 * Calculate all workout metrics
 */
export function calculateWorkoutMetrics(workout: Workout, ftp: number): WorkoutMetrics {
  const totalDuration = workout.steps.reduce((sum, step) => sum + getStepDuration(step), 0);
  const normalizedPower = calculateNormalizedPower(workout.steps, ftp);
  const averagePower = calculateAveragePower(workout.steps, ftp);
  
  // Intensity Factor = NP / FTP
  const intensityFactor = ftp > 0 ? normalizedPower / ftp : 0;
  
  // TSS = (duration_s × NP × IF) / (FTP × 3600) × 100
  const tss = ftp > 0 
    ? (totalDuration * normalizedPower * intensityFactor) / (ftp * 3600) * 100
    : 0;

  return {
    totalDuration,
    normalizedPower: Math.round(normalizedPower),
    averagePower: Math.round(averagePower),
    intensityFactor: Math.round(intensityFactor * 100) / 100,
    tss: Math.round(tss),
  };
}

/**
 * Format duration as HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get TSS category/color
 */
export function getTssCategory(tss: number): { label: string; color: string } {
  if (tss < 50) return { label: "Easy", color: "text-green-600" };
  if (tss < 100) return { label: "Moderate", color: "text-yellow-600" };
  if (tss < 150) return { label: "Hard", color: "text-orange-600" };
  return { label: "Very Hard", color: "text-red-600" };
}
