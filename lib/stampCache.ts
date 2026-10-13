"use client";

const CACHE_PREFIX = "qr_loyalty_visited_";

interface CachedVisit {
  name: string;
  phone: string;
  lastVisit: string; // ISO date
}

/**
 * Get cached customer info for a specific merchant.
 * Returns null if never visited this merchant before.
 */
export function getCachedVisit(merchantId: string): CachedVisit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + merchantId);
    if (!raw) return null;
    return JSON.parse(raw) as CachedVisit;
  } catch {
    return null;
  }
}

/**
 * Cache customer info after a successful stamp request for a merchant.
 */
export function saveCachedVisit(
  merchantId: string,
  name: string,
  phone: string
): void {
  if (typeof window === "undefined") return;
  try {
    const data: CachedVisit = {
      name,
      phone,
      lastVisit: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_PREFIX + merchantId, JSON.stringify(data));
  } catch {}
}

/**
 * Clear cache for a specific merchant.
 */
export function clearCachedVisit(merchantId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_PREFIX + merchantId);
  } catch {}
}