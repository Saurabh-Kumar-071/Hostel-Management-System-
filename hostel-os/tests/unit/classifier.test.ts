import { describe, it, expect } from "vitest";
import { classifyComplaint } from "@/lib/ai/classifier";

describe("AI Complaint Classifier", () => {
  it("should classify electrical issues and identify urgency", async () => {
    const result = await classifyComplaint(
      "Spark from main power switch",
      "Whenever I plug in the heater, sparks fly out and there is smoke."
    );

    expect(result.suggestedCategory).toBe("electrical");
    expect(result.isUrgent).toBe(true);
    expect(result.suggestedPriority).toBe("urgent");
    expect(result.department).toBe("Electrical Maintenance");
  });

  it("should classify standard plumbing issues", async () => {
    const result = await classifyComplaint(
      "Bathroom washbasin tap leaking",
      "The washbasin tap has a steady slow leak when turned completely off."
    );

    expect(result.suggestedCategory).toBe("plumbing");
    expect(result.department).toBe("Plumbing Services");
  });
});

