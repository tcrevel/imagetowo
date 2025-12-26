/**
 * Step Schema Tests
 * 
 * @see lib/schemas/step.ts
 */

import { describe, it, expect } from "vitest";
import {
  WarmupStepSchema,
  CooldownStepSchema,
  SteadyStepSchema,
  IntervalsStepSchema,
  FreerideStepSchema,
  StepSchema,
} from "@/lib/schemas/step";

describe("Step Schemas", () => {
  describe("WarmupStepSchema", () => {
    it("validates a valid warmup step", () => {
      const result = WarmupStepSchema.safeParse({
        type: "warmup",
        duration_s: 600,
        power_start_pct: 50,
        power_end_pct: 75,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative duration", () => {
      const result = WarmupStepSchema.safeParse({
        type: "warmup",
        duration_s: -1,
        power_start_pct: 50,
        power_end_pct: 75,
      });
      expect(result.success).toBe(false);
    });

    it("rejects power over 200%", () => {
      const result = WarmupStepSchema.safeParse({
        type: "warmup",
        duration_s: 600,
        power_start_pct: 50,
        power_end_pct: 250,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CooldownStepSchema", () => {
    it("validates a valid cooldown step", () => {
      const result = CooldownStepSchema.safeParse({
        type: "cooldown",
        duration_s: 300,
        power_start_pct: 70,
        power_end_pct: 40,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("SteadyStepSchema", () => {
    it("validates a valid steady step", () => {
      const result = SteadyStepSchema.safeParse({
        type: "steady",
        duration_s: 1200,
        power_pct: 88,
      });
      expect(result.success).toBe(true);
    });

    it("allows 0% power (recovery)", () => {
      const result = SteadyStepSchema.safeParse({
        type: "steady",
        duration_s: 60,
        power_pct: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("IntervalsStepSchema", () => {
    it("validates a valid intervals step", () => {
      const result = IntervalsStepSchema.safeParse({
        type: "intervals",
        repeat: 5,
        on_duration_s: 180,
        off_duration_s: 180,
        on_power_pct: 120,
        off_power_pct: 50,
      });
      expect(result.success).toBe(true);
    });

    it("rejects zero repetitions", () => {
      const result = IntervalsStepSchema.safeParse({
        type: "intervals",
        repeat: 0,
        on_duration_s: 180,
        off_duration_s: 180,
        on_power_pct: 120,
        off_power_pct: 50,
      });
      expect(result.success).toBe(false);
    });

    it("requires integer repetitions", () => {
      const result = IntervalsStepSchema.safeParse({
        type: "intervals",
        repeat: 3.5,
        on_duration_s: 180,
        off_duration_s: 180,
        on_power_pct: 120,
        off_power_pct: 50,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("FreerideStepSchema", () => {
    it("validates a valid freeride step", () => {
      const result = FreerideStepSchema.safeParse({
        type: "freeride",
        duration_s: 300,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("StepSchema (discriminated union)", () => {
    it("parses warmup step correctly", () => {
      const result = StepSchema.safeParse({
        type: "warmup",
        duration_s: 600,
        power_start_pct: 50,
        power_end_pct: 75,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("warmup");
      }
    });

    it("parses intervals step correctly", () => {
      const result = StepSchema.safeParse({
        type: "intervals",
        repeat: 5,
        on_duration_s: 30,
        off_duration_s: 30,
        on_power_pct: 150,
        off_power_pct: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("intervals");
      }
    });

    it("rejects unknown step type", () => {
      const result = StepSchema.safeParse({
        type: "unknown",
        duration_s: 300,
      });
      expect(result.success).toBe(false);
    });
  });
});
