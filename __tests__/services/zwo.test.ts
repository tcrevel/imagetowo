/**
 * ZWO Generator Tests
 * 
 * @see lib/services/zwo.ts
 * @see specs/001-workout-image-to-zwo/contracts/export.md
 */

import { describe, it, expect } from "vitest";
import { workoutToZwo, generateZwoFilename } from "@/lib/services/zwo";
import type { Workout } from "@/lib/schemas";

describe("ZWO Generator", () => {
  describe("workoutToZwo", () => {
    it("generates warmup-only workout", () => {
      const workout: Workout = {
        name: "Warmup Only",
        steps: [
          { type: "warmup", duration_s: 600, power_start_pct: 50, power_end_pct: 75 },
        ],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<workout_file>");
      expect(xml).toContain("<author>ImageToFit</author>");
      expect(xml).toContain("<name>Warmup Only</name>");
      expect(xml).toContain("<sportType>bike</sportType>");
      expect(xml).toContain('<Warmup Duration="600" PowerLow="0.50" PowerHigh="0.75"/>');
      expect(xml).toContain("</workout_file>");
    });

    it("generates cooldown-only workout", () => {
      const workout: Workout = {
        name: "Cooldown",
        steps: [
          { type: "cooldown", duration_s: 300, power_start_pct: 70, power_end_pct: 40 },
        ],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain('<Cooldown Duration="300" PowerLow="0.70" PowerHigh="0.40"/>');
    });

    it("generates steady state workout", () => {
      const workout: Workout = {
        name: "Steady",
        steps: [{ type: "steady", duration_s: 1200, power_pct: 88 }],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain('<SteadyState Duration="1200" Power="0.88"/>');
    });

    it("generates intervals workout", () => {
      const workout: Workout = {
        name: "Intervals",
        steps: [
          {
            type: "intervals",
            repeat: 5,
            on_duration_s: 60,
            off_duration_s: 60,
            on_power_pct: 120,
            off_power_pct: 50,
          },
        ],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain(
        '<IntervalsT Repeat="5" OnDuration="60" OffDuration="60" OnPower="1.20" OffPower="0.50"/>'
      );
    });

    it("generates freeride workout", () => {
      const workout: Workout = {
        name: "Free",
        steps: [{ type: "freeride", duration_s: 600 }],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain('<FreeRide Duration="600"/>');
    });

    it("generates complete workout with all step types", () => {
      const workout: Workout = {
        name: "Complete Workout",
        description: "A full test workout",
        steps: [
          { type: "warmup", duration_s: 600, power_start_pct: 45, power_end_pct: 70 },
          { type: "steady", duration_s: 300, power_pct: 75 },
          {
            type: "intervals",
            repeat: 3,
            on_duration_s: 180,
            off_duration_s: 180,
            on_power_pct: 110,
            off_power_pct: 55,
          },
          { type: "freeride", duration_s: 300 },
          { type: "cooldown", duration_s: 300, power_start_pct: 60, power_end_pct: 35 },
        ],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain("<name>Complete Workout</name>");
      expect(xml).toContain("<description>A full test workout</description>");
      expect(xml).toContain("<Warmup");
      expect(xml).toContain("<SteadyState");
      expect(xml).toContain("<IntervalsT");
      expect(xml).toContain("<FreeRide");
      expect(xml).toContain("<Cooldown");
    });

    it("escapes special characters in name", () => {
      const workout: Workout = {
        name: 'Test & <Challenge> "Workout"',
        steps: [{ type: "steady", duration_s: 60, power_pct: 50 }],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain("&amp;");
      expect(xml).toContain("&lt;");
      expect(xml).toContain("&gt;");
      expect(xml).toContain("&quot;");
      expect(xml).not.toContain("<Challenge>");
    });

    it("escapes special characters in description", () => {
      const workout: Workout = {
        name: "Test",
        description: "Power > 100% & recover",
        steps: [{ type: "steady", duration_s: 60, power_pct: 50 }],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain("Power &gt; 100% &amp; recover");
    });

    it("handles unicode characters", () => {
      const workout: Workout = {
        name: "Séance Café ☕",
        steps: [{ type: "steady", duration_s: 60, power_pct: 50 }],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain("Séance Café ☕");
    });

    it("handles maximum length name (100 chars)", () => {
      const workout: Workout = {
        name: "A".repeat(100),
        steps: [{ type: "steady", duration_s: 60, power_pct: 50 }],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain(`<name>${"A".repeat(100)}</name>`);
    });

    it("omits description if not provided", () => {
      const workout: Workout = {
        name: "No Description",
        steps: [{ type: "steady", duration_s: 60, power_pct: 50 }],
      };

      const xml = workoutToZwo(workout);

      expect(xml).not.toContain("<description>");
    });

    it("converts power correctly for edge cases", () => {
      const workout: Workout = {
        name: "Power Test",
        steps: [
          { type: "steady", duration_s: 60, power_pct: 0 }, // 0%
          { type: "steady", duration_s: 60, power_pct: 100 }, // 100%
          { type: "steady", duration_s: 60, power_pct: 200 }, // 200%
        ],
      };

      const xml = workoutToZwo(workout);

      expect(xml).toContain('Power="0.00"');
      expect(xml).toContain('Power="1.00"');
      expect(xml).toContain('Power="2.00"');
    });
  });

  describe("generateZwoFilename", () => {
    it("converts to lowercase and replaces spaces", () => {
      expect(generateZwoFilename("Sweet Spot 30")).toBe("sweet-spot-30.zwo");
    });

    it("removes special characters", () => {
      expect(generateZwoFilename("Sweet Spot 45!")).toBe("sweet-spot-45.zwo");
    });

    it("handles multiple spaces", () => {
      expect(generateZwoFilename("My   Workout")).toBe("my-workout.zwo");
    });

    it("removes leading/trailing hyphens", () => {
      expect(generateZwoFilename(" -Test- ")).toBe("test.zwo");
    });

    it("returns default for empty name after sanitization", () => {
      expect(generateZwoFilename("!!!")).toBe("workout.zwo");
    });

    it("handles unicode characters by removing them", () => {
      expect(generateZwoFilename("Séance ☕")).toBe("sance.zwo");
    });
  });
});
