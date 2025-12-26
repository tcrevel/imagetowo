import { describe, it, expect } from "vitest";

describe("Vitest Setup", () => {
  it("should run tests", () => {
    expect(true).toBe(true);
  });

  it("should support TypeScript", () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(1, 2)).toBe(3);
  });
});
