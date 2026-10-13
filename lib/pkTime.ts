/**
 * Pakistan Time helpers.
 *
 * Pakistan is UTC+5 with no daylight saving.
 * PKT = UTC + 5 hours
 */

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // +5 hours

/**
 * Get "now" as a Date in PKT context.
 */
export function nowPKT(): Date {
  const now = new Date();
  return new Date(now.getTime() + PKT_OFFSET_MS);
}

/**
 * Given an expiry date, compute when it should ACTUALLY expire:
 * at 23:59:59.999 PKT of that calendar day.
 */
export function endOfDayPKT(date: Date | string): Date {
  const d = new Date(date);
  const pktTime = d.getTime() + PKT_OFFSET_MS;
  const pkt = new Date(pktTime);

  const year = pkt.getUTCFullYear();
  const month = pkt.getUTCMonth();
  const day = pkt.getUTCDate();

  const endPKT = Date.UTC(year, month, day, 23, 59, 59, 999);
  return new Date(endPKT - PKT_OFFSET_MS);
}

/**
 * Days remaining until end-of-day in PKT (old helper — kept for compatibility).
 */
export function daysUntilPKTEnd(date: Date | string): number {
  const now = new Date();
  const end = endOfDayPKT(date);

  const nowPKTDate = new Date(now.getTime() + PKT_OFFSET_MS);
  const endPKTDate = new Date(end.getTime() + PKT_OFFSET_MS);

  const nowDay = Date.UTC(
    nowPKTDate.getUTCFullYear(),
    nowPKTDate.getUTCMonth(),
    nowPKTDate.getUTCDate()
  );
  const endDay = Date.UTC(
    endPKTDate.getUTCFullYear(),
    endPKTDate.getUTCMonth(),
    endPKTDate.getUTCDate()
  );

  return Math.round((endDay - nowDay) / (1000 * 60 * 60 * 24));
}

/**
 * Hours remaining until end-of-day in PKT.
 */
export function hoursUntilPKTEnd(date: Date | string): number {
  const end = endOfDayPKT(date);
  return (end.getTime() - Date.now()) / (1000 * 60 * 60);
}

/**
 * True if current time is past end-of-day PKT.
 */
export function isExpiredPKT(date: Date | string): boolean {
  return Date.now() > endOfDayPKT(date).getTime();
}

/**
 * Format a date as a PKT-friendly string (e.g., "October 11, 2026").
 */
export function formatPKTDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-PK", {
    timeZone: "Asia/Karachi",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Number of calendar days between TODAY (in PKT) and the expiry date (in PKT).
 *
 * Returns:
 *   0  → expiry is TODAY
 *   1  → expiry is TOMORROW
 *   2  → in 2 days
 *   -1 → expired yesterday
 */
export function calendarDaysLeftPKT(date: Date | string): number {
  const d = new Date(date);

  // Expiry day in PKT
  const endOfDayUTC = endOfDayPKT(d);
  const endPKT = new Date(endOfDayUTC.getTime() + PKT_OFFSET_MS);

  // Today in PKT
  const now = new Date();
  const nowPKT = new Date(now.getTime() + PKT_OFFSET_MS);

  // Extract calendar dates in PKT
  const endDayUTC = Date.UTC(
    endPKT.getUTCFullYear(),
    endPKT.getUTCMonth(),
    endPKT.getUTCDate()
  );
  const nowDayUTC = Date.UTC(
    nowPKT.getUTCFullYear(),
    nowPKT.getUTCMonth(),
    nowPKT.getUTCDate()
  );

  return Math.round((endDayUTC - nowDayUTC) / (1000 * 60 * 60 * 24));
}