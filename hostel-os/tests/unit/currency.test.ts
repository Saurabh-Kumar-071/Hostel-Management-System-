import { describe, it, expect } from "vitest";
import { formatCurrency, rupeesToPaise } from "@/lib/utils";

describe("Decimal-safe Currency Utility", () => {
  it("should convert decimal rupees into integer paise without float inaccuracies", () => {
    expect(rupeesToPaise(100.5)).toBe(10050);
    expect(rupeesToPaise(12500)).toBe(1250000);
    expect(rupeesToPaise(0.99)).toBe(99);
  });

  it("should format integer paise into proper INR currency strings", () => {
    const formatted = formatCurrency(1250000);
    expect(formatted).toContain("12,500");
  });
});

