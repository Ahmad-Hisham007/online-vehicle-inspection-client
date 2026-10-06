import { describe, it, expect } from "vitest";
import { hashSeed, mulberry32 } from "@/app/lib/pdf/rng";

describe("mulberry32", () => {
  it("returns the same sequence for the same seed", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("keeps every value in [0, 1)", () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 1000; i += 1) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("hashSeed", () => {
  it("is deterministic", () => {
    expect(hashSeed(["234", "uber", "2026-10-06T00:00:00Z"])).toBe(
      hashSeed(["234", "uber", "2026-10-06T00:00:00Z"]),
    );
  });

  it("is order-sensitive", () => {
    expect(hashSeed(["234", "uber"])).not.toBe(hashSeed(["uber", "234"]));
  });

  it('separates boundaries (["a","b"] ≠ ["ab"])', () => {
    expect(hashSeed(["a", "b"])).not.toBe(hashSeed(["ab"]));
  });

  it("returns a uint32 integer", () => {
    const seed = hashSeed(["anything"]);
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(4294967295);
  });
});