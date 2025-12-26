/**
 * API Schema Tests
 * 
 * @see lib/schemas/api.ts
 */

import { describe, it, expect } from "vitest";
import {
  ParseResponseSchema,
  ParseErrorSchema,
  ExportRequestSchema,
} from "@/lib/schemas/api";

describe("API Schemas", () => {
  describe("ParseResponseSchema", () => {
    it("validates a successful parse response", () => {
      const result = ParseResponseSchema.safeParse({
        workout: {
          name: "Sweet Spot 30",
          steps: [
            { type: "warmup", duration_s: 600, power_start_pct: 50, power_end_pct: 75 },
            { type: "steady", duration_s: 1200, power_pct: 88 },
          ],
        },
        warnings: [],
        confidence: 0.95,
      });
      expect(result.success).toBe(true);
    });

    it("validates response with warnings", () => {
      const result = ParseResponseSchema.safeParse({
        workout: {
          name: "VO2 Max",
          steps: [{ type: "freeride", duration_s: 300 }],
        },
        warnings: [
          "Step 1: Duration unclear, estimated 5 minutes",
          "Overall: Some text partially obscured",
        ],
        confidence: 0.72,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warnings).toHaveLength(2);
      }
    });

    it("rejects confidence over 1.0", () => {
      const result = ParseResponseSchema.safeParse({
        workout: {
          name: "Test",
          steps: [{ type: "steady", duration_s: 60, power_pct: 50 }],
        },
        warnings: [],
        confidence: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative confidence", () => {
      const result = ParseResponseSchema.safeParse({
        workout: {
          name: "Test",
          steps: [{ type: "steady", duration_s: 60, power_pct: 50 }],
        },
        warnings: [],
        confidence: -0.1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ParseErrorSchema", () => {
    it("validates a parse error response", () => {
      const result = ParseErrorSchema.safeParse({
        error: "Unable to parse workout from image",
        code: "PARSE_FAILED",
      });
      expect(result.success).toBe(true);
    });

    it("validates error without details", () => {
      const result = ParseErrorSchema.safeParse({
        error: "File too large",
        code: "FILE_TOO_LARGE",
      });
      expect(result.success).toBe(true);
    });

    it("rejects unknown error code", () => {
      const result = ParseErrorSchema.safeParse({
        error: "Unknown error",
        code: "UNKNOWN_CODE",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ExportRequestSchema", () => {
    it("validates an export request", () => {
      const result = ExportRequestSchema.safeParse({
        workout: {
          name: "Export Test",
          steps: [
            { type: "warmup", duration_s: 300, power_start_pct: 40, power_end_pct: 70 },
            { type: "steady", duration_s: 1200, power_pct: 90 },
            { type: "cooldown", duration_s: 300, power_start_pct: 70, power_end_pct: 40 },
          ],
        },
      });
      expect(result.success).toBe(true);
    });
  });
});
