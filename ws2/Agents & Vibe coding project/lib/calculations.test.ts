import { describe, it, expect } from "vitest";
import { calculateTenure, getTenureBracket, getPromotionWindow } from "@/lib/calculations";

// ---------------------------------------------------------------------------
// Bug 8: calculateTenure, getTenureBracket, getPromotionWindow edge cases
// ---------------------------------------------------------------------------

describe("calculateTenure", () => {
  it("should return 0 years and 0 months when hire date is today", () => {
    const today = new Date();
    const result = calculateTenure(today);
    expect(result.years).toBe(0);
    expect(result.months).toBe(0);
  });

  it("should return exactly 1 year when hired exactly one year ago", () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const result = calculateTenure(oneYearAgo);
    expect(result.years).toBe(1);
    expect(result.months).toBe(0);
    expect(result.display).toBe("1 year");
  });

  it("should return correct months when hired less than a year ago", () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const result = calculateTenure(sixMonthsAgo);
    expect(result.years).toBe(0);
    // Could be 5 or 6 months depending on day-of-month edge
    expect(result.months).toBeGreaterThanOrEqual(5);
    expect(result.months).toBeLessThanOrEqual(6);
  });

  it("should display years and months when tenure has both", () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 2);
    date.setMonth(date.getMonth() - 3);
    const result = calculateTenure(date);
    // Could be 2y 2m or 2y 3m depending on day-of-month
    expect(result.years).toBe(2);
    expect(result.months).toBeGreaterThanOrEqual(2);
    expect(result.months).toBeLessThanOrEqual(3);
    expect(result.display).toMatch(/^2y \d+m$/);
  });
});

describe("getTenureBracket", () => {
  it("should return '<1 year' when hired today", () => {
    expect(getTenureBracket(new Date())).toBe("<1 year");
  });

  it("should return '1-3 years' when hired exactly 1 year ago", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    expect(getTenureBracket(d)).toBe("1-3 years");
  });

  it("should return '1-3 years' when hired 2 years ago (boundary)", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    expect(getTenureBracket(d)).toBe("1-3 years");
  });

  it("should return '3-5 years' when hired 3 years ago", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    expect(getTenureBracket(d)).toBe("3-5 years");
  });

  it("should return '5+ years' when hired 5 years ago", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 5);
    expect(getTenureBracket(d)).toBe("5+ years");
  });

  it("should return '5+ years' when hired 10 years ago", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    expect(getTenureBracket(d)).toBe("5+ years");
  });
});

describe("getPromotionWindow", () => {
  it("should return not-yet when employee has less than 2 years tenure", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    const result = getPromotionWindow(d);
    expect(result.eligible).toBe(false);
    expect(result.urgency).toBe("not-yet");
  });

  it("should return approaching when employee is at exactly 2 years", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    const result = getPromotionWindow(d);
    expect(result.eligible).toBe(true);
    expect(result.urgency).toBe("approaching");
  });

  it("should return overdue when employee has 3 or more years tenure", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    const result = getPromotionWindow(d);
    expect(result.eligible).toBe(true);
    expect(result.urgency).toBe("overdue");
  });

  it("should return overdue when employee has 10 years tenure", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    const result = getPromotionWindow(d);
    expect(result.eligible).toBe(true);
    expect(result.urgency).toBe("overdue");
    expect(result.yearsInRole).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Regression tests for Bug #1: getPromotionWindow boundary (<=2 should be <2)
// ---------------------------------------------------------------------------
describe("getPromotionWindow boundary regression", () => {
  it("should return approaching with eligible=true when employee has exactly 2 years tenure", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    const result = getPromotionWindow(d);
    expect(result.eligible).toBe(true);
    expect(result.urgency).toBe("approaching");
    expect(result.yearsInRole).toBe(2);
  });

  it("should return not-yet when employee has 1.5 years tenure and overdue when employee has 3 years tenure", () => {
    // 1.5 years => not-yet
    const d1 = new Date();
    d1.setFullYear(d1.getFullYear() - 1);
    d1.setMonth(d1.getMonth() - 6);
    const result1 = getPromotionWindow(d1);
    expect(result1.eligible).toBe(false);
    expect(result1.urgency).toBe("not-yet");

    // 3 years => overdue
    const d2 = new Date();
    d2.setFullYear(d2.getFullYear() - 3);
    const result2 = getPromotionWindow(d2);
    expect(result2.eligible).toBe(true);
    expect(result2.urgency).toBe("overdue");
  });
});
