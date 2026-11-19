import type { ComplaintCategory, ComplaintPriority } from "@/types";

export interface AIClassificationResult {
  suggestedCategory: ComplaintCategory;
  suggestedPriority: ComplaintPriority;
  summary: string;
  department: string;
  isUrgent: boolean;
  confidence: number;
}

const URGENT_KEYWORDS = [
  "spark",
  "short circuit",
  "fire",
  "smoke",
  "shock",
  "flood",
  "burst",
  "leaking heavily",
  "overflowing",
  "broken lock",
  "intruder",
  "theft",
  "danger",
  "emergency",
];

const CATEGORY_MAP: Record<string, ComplaintCategory> = {
  wire: "electrical",
  power: "electrical",
  light: "electrical",
  fan: "electrical",
  switch: "electrical",
  ac: "electrical",
  pipe: "plumbing",
  tap: "plumbing",
  leak: "plumbing",
  drain: "plumbing",
  water: "plumbing",
  wifi: "internet",
  router: "internet",
  lan: "internet",
  network: "internet",
  dust: "cleaning",
  garbage: "cleaning",
  broom: "cleaning",
  bed: "furniture",
  chair: "furniture",
  table: "furniture",
  cupboard: "furniture",
  lock: "security",
  door: "security",
  window: "security",
};

export async function classifyComplaint(
  title: string,
  description: string
): Promise<AIClassificationResult> {
  const combinedText = `${title} ${description}`.toLowerCase();

  // Deterministic Rule-Based Classification
  const isUrgent = URGENT_KEYWORDS.some((word) => combinedText.includes(word));

  let matchedCategory: ComplaintCategory = "other";
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (combinedText.includes(keyword)) {
      matchedCategory = cat;
      break;
    }
  }

  let priority: ComplaintPriority = "medium";
  if (isUrgent) {
    priority = "urgent";
  } else if (matchedCategory === "electrical" || matchedCategory === "security") {
    priority = "high";
  } else if (matchedCategory === "cleaning") {
    priority = "low";
  }

  const departmentMap: Record<ComplaintCategory, string> = {
    electrical: "Electrical Maintenance",
    plumbing: "Plumbing Services",
    internet: "IT & Network Infrastructure",
    cleaning: "Housekeeping & Sanitation",
    furniture: "Carpentry & Estate",
    security: "Campus Security Division",
    other: "General Facilities",
  };

  return {
    suggestedCategory: matchedCategory,
    suggestedPriority: priority,
    summary: `${title.slice(0, 60)}... Reported by resident`,
    department: departmentMap[matchedCategory],
    isUrgent,
    confidence: isUrgent ? 0.95 : 0.85,
  };
}
