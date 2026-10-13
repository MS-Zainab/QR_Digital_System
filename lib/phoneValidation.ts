/**
 * Pakistani phone helpers.
 *
 * Stored format: 03XXXXXXXXX (11 digits)
 * User input:    9 digits (e.g., 001234567)  → we auto-prefix "03"
 */

export function normalizePkPhone(input: string): string | null {
  if (!input) return null;

  let digits = input.replace(/\D/g, "");

  // Country code variants
  if (digits.startsWith("0092") && digits.length === 14) {
    digits = digits.slice(4);
  } else if (digits.startsWith("92") && digits.length === 12) {
    digits = digits.slice(2);
  }

  // 9 digits → prefix "03"
  if (digits.length === 9) {
    digits = "03" + digits;
  }
  // 10 digits starting with "3" → prefix "0"
  else if (digits.length === 10 && digits.startsWith("3")) {
    digits = "0" + digits;
  }

  if (!/^03\d{9}$/.test(digits)) {
    return null;
  }

  return digits;
}

export function formatPkPhone(local: string): string {
  const normalized = normalizePkPhone(local);
  if (!normalized) return local;
  return `+92 ${normalized.slice(1, 4)} ${normalized.slice(4)}`;
}

export function isValidPkPhone(input: string): boolean {
  return normalizePkPhone(input) !== null;
}

/**
 * Extract the 9 user-typed digits (without "03" prefix).
 */
export function extractPkDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92") && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith("03") && digits.length > 9) digits = digits.slice(2);
  else if (digits.startsWith("3") && digits.length === 10) digits = digits.slice(1);
  return digits.slice(0, 9);
}