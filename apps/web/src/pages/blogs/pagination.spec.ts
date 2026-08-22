import { describe, it, expect } from "vitest";
import { pageWindow } from "./pagination";

describe("pageWindow", () => {
  it("lists every page when the archive is short", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("elides only the far end when near the start", () => {
    // No leading gap: page 2 is adjacent to page 1, so there is nothing to hide.
    expect(pageWindow(1, 20)).toEqual([1, 2, "gap", 20]);
    expect(pageWindow(2, 20)).toEqual([1, 2, 3, "gap", 20]);
    expect(pageWindow(3, 20)).toEqual([1, 2, 3, 4, "gap", 20]);
  });

  it("elides only the near end when close to the last page", () => {
    expect(pageWindow(20, 20)).toEqual([1, "gap", 19, 20]);
    expect(pageWindow(19, 20)).toEqual([1, "gap", 18, 19, 20]);
  });

  it("elides both ends in the middle of a long archive", () => {
    expect(pageWindow(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
  });

  it("never repeats the first or last page", () => {
    for (let page = 1; page <= 20; page++) {
      const entries = pageWindow(page, 20);
      const numbers = entries.filter((e): e is number => e !== "gap");
      expect(new Set(numbers).size).toBe(numbers.length);
      expect(numbers[0]).toBe(1);
      expect(numbers[numbers.length - 1]).toBe(20);
    }
  });

  it("keeps page numbers ascending, gaps included", () => {
    const numbers = pageWindow(8, 30).filter((e): e is number => e !== "gap");
    expect([...numbers].sort((a, b) => a - b)).toEqual(numbers);
  });
});
