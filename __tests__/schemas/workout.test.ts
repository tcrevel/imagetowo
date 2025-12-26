/**
 * Workout Schema Tests
 * 
 * @see lib/schemas/workout.ts
 */

import { describe, it, expect } from "vitest";
import { WorkoutSchema } from "@/lib/schemas/workout";

describe("WorkoutSchema", () => {
  it("validates a simple workout", () => {
    const result = WorkoutSchema.safeParse({
      name: "Sweet Spot 30",
      description: "30 minute sweet spot session",
      steps: [
        { type: "warmup", duration_s: 600, power_start_pct: 50, power_end_pct: 75 },
        { type: "steady", duration_s: 1200, power_pct: 88 },
        { type: "cooldown", duration_s: 300, power_start_pct: 70, power_end_pct: 40 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("validates a workout with intervals", () => {
    const result = WorkoutSchema.safeParse({
      name: "VO2 Max Intervals",
      steps: [
        { type: "warmup", duration_s: 600, power_start_pct: 45, power_end_pct: 70 },
        {
          type: "intervals",
          repeat: 5,
          on_duration_s: 180,
          off_duration_s: 180,
          on_power_pct: 120,
          off_power_pct: 50,
        },
        { type: "freeride", duration_s: 300 },
        { type: "cooldown", duration_s: 300, power_start_pct: 60, power_end_pct: 35 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("allows optional description", () => {
    const result = WorkoutSchema.safeParse({
      name: "Test Workout",
      steps: [{ type: "steady", duration_s: 600, power_pct: 75 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = WorkoutSchema.safeParse({
      name: "",
      steps: [{ type: "steady", duration_s: 600, power_pct: 75 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("required");
    }
  });

  it("rejects name over 100 characters", () => {
    const result = WorkoutSchema.safeParse({
      name: "A".repeat(101),
      steps: [{ type: "steady", duration_s: 600, power_pct: 75 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty steps array", () => {
    const result = WorkoutSchema.safeParse({
      name: "Empty Workout",
      steps: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("At least one step");
    }
  });

  it("rejects workout without steps", () => {
    const result = WorkoutSchema.safeParse({
      name: "No Steps",
    });
    expect(result.success).toBe(false);
  });
});
