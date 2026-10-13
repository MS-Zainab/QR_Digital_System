/**
 * Curated color palette for merchant branding.
 * Grouped by vibe so merchants can pick a mood.
 */

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ColorCategory {
  label: string;
  colors: ColorOption[];
}

export const COLOR_CATEGORIES: ColorCategory[] = [
  {
    label: "Classic Business",
    colors: [
      { name: "Royal Blue", hex: "#1e40af" },
      { name: "Navy", hex: "#0f172a" },
      { name: "Corporate Blue", hex: "#2563eb" },
      { name: "Slate", hex: "#475569" },
    ],
  },
  {
    label: "Warm & Cozy (Cafes)",
    colors: [
      { name: "Coffee Brown", hex: "#78350f" },
      { name: "Amber", hex: "#d97706" },
      { name: "Caramel", hex: "#b45309" },
      { name: "Mocha", hex: "#92400e" },
    ],
  },
  {
    label: "Vibrant & Energetic",
    colors: [
      { name: "Hot Pink", hex: "#db2777" },
      { name: "Coral", hex: "#f43f5e" },
      { name: "Sunset Orange", hex: "#ea580c" },
      { name: "Sunshine", hex: "#f59e0b" },
    ],
  },
  {
    label: "Fresh & Natural",
    colors: [
      { name: "Emerald", hex: "#059669" },
      { name: "Forest Green", hex: "#166534" },
      { name: "Olive", hex: "#65a30d" },
      { name: "Mint", hex: "#10b981" },
    ],
  },
  {
    label: "Elegant & Luxury",
    colors: [
      { name: "Purple Royale", hex: "#7c3aed" },
      { name: "Deep Violet", hex: "#6d28d9" },
      { name: "Rose Gold", hex: "#e11d48" },
      { name: "Burgundy", hex: "#831843" },
    ],
  },
  {
    label: "Modern & Minimal",
    colors: [
      { name: "Indigo", hex: "#4f46e5" },
      { name: "Teal", hex: "#0d9488" },
      { name: "Sky", hex: "#0891b2" },
      { name: "Charcoal", hex: "#1f2937" },
    ],
  },
];

/**
 * Check if a hex string is valid (6-digit format).
 */
export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/**
 * Normalize a hex input — ensures lowercase and # prefix.
 */
export function normalizeHex(input: string): string | null {
  let cleaned = input.trim().toLowerCase();
  if (!cleaned.startsWith("#")) cleaned = "#" + cleaned;
  // Expand 3-digit hex to 6
  if (/^#[0-9a-f]{3}$/.test(cleaned)) {
    cleaned =
      "#" +
      cleaned[1] + cleaned[1] +
      cleaned[2] + cleaned[2] +
      cleaned[3] + cleaned[3];
  }
  return isValidHex(cleaned) ? cleaned : null;
}