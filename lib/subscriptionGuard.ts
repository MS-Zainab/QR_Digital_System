import { prisma } from "./prisma";
import {
  endOfDayPKT,
  daysUntilPKTEnd,
  isExpiredPKT,
} from "./pkTime";

export type SubscriptionStatus =
  | "PENDING_APPROVAL"
  | "TRIAL"
  | "ACTIVE"
  | "EXPIRED"
  | "BLOCKED"
  | "CANCELLED";

export interface SubscriptionCheck {
  allowed: boolean;
  status: SubscriptionStatus;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isPending: boolean;
  isBlocked: boolean;
  trialEndsAt: Date | null;
  currentPeriodEndsAt: Date | null;
  daysLeft: number | null;
  hoursLeft: number | null;
  effectiveEndDate: Date | null;
  reason: string;
}

export async function checkSubscription(
  merchantId: string
): Promise<SubscriptionCheck | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
    },
  });

  if (!merchant) return null;

  return evaluateSubscription(merchant);
}

/**
 * Pure function — evaluate subscription state from merchant data.
 * Uses PKT end-of-day for accurate expiry.
 */
export function evaluateSubscription(merchant: {
  subscriptionStatus: string;
  trialEndsAt: Date | string | null;
  currentPeriodEndsAt: Date | string | null;
}): SubscriptionCheck {
  const status = merchant.subscriptionStatus as SubscriptionStatus;

  const trialEndsAt = merchant.trialEndsAt
    ? new Date(merchant.trialEndsAt)
    : null;
  const currentPeriodEndsAt = merchant.currentPeriodEndsAt
    ? new Date(merchant.currentPeriodEndsAt)
    : null;

  // Determine the effective end date
  let effectiveEnd: Date | null = null;
  if (status === "TRIAL") effectiveEnd = trialEndsAt;
  else if (status === "ACTIVE") effectiveEnd = currentPeriodEndsAt;

  // Compute days/hours left using PKT end-of-day
  let daysLeft: number | null = null;
  let hoursLeft: number | null = null;
  if (effectiveEnd) {
    daysLeft = daysUntilPKTEnd(effectiveEnd);
    hoursLeft =
      (endOfDayPKT(effectiveEnd).getTime() - Date.now()) / (1000 * 60 * 60);
  }

  const isPending = status === "PENDING_APPROVAL";
  const isTrial = status === "TRIAL";
  const isActive = status === "ACTIVE";
  const isExpiredStatus = status === "EXPIRED";
  const isBlocked = status === "BLOCKED";
  const isCancelled = status === "CANCELLED";

  // Auto-detect expiry — anything past end-of-day PKT is expired
  let effectiveStatus = status;
  if (isTrial && effectiveEnd && isExpiredPKT(effectiveEnd)) {
    effectiveStatus = "EXPIRED";
  }
  if (isActive && effectiveEnd && isExpiredPKT(effectiveEnd)) {
    effectiveStatus = "EXPIRED";
  }

  let allowed = false;
  let reason = "";

  if (effectiveStatus === "TRIAL" || effectiveStatus === "ACTIVE") {
    allowed = true;
    reason = "Active";
  } else if (effectiveStatus === "PENDING_APPROVAL") {
    allowed = false;
    reason = "Awaiting admin approval";
  } else if (effectiveStatus === "EXPIRED") {
    allowed = false;
    reason = "Subscription expired";
  } else if (effectiveStatus === "BLOCKED") {
    allowed = false;
    reason = "Account blocked by admin";
  } else if (effectiveStatus === "CANCELLED") {
    allowed = false;
    reason = "Account cancelled";
  } else {
    allowed = false;
    reason = `Unknown status: ${effectiveStatus}`;
  }

  return {
    allowed,
    status: effectiveStatus as SubscriptionStatus,
    isActive: effectiveStatus === "ACTIVE",
    isTrial: effectiveStatus === "TRIAL",
    isExpired: effectiveStatus === "EXPIRED",
    isPending: effectiveStatus === "PENDING_APPROVAL",
    isBlocked: effectiveStatus === "BLOCKED",
    trialEndsAt,
    currentPeriodEndsAt,
    daysLeft,
    hoursLeft,
    effectiveEndDate: effectiveEnd,
    reason,
  };
}

/**
 * Get warning level for a trial (for banners & notifications).
 *
 * Returns:
 *   0 = no warning (over 7 days left)
 *   1 = info   (≤7 days left, blue)
 *   2 = warning (≤3 days left, amber)
 *   3 = urgent (≤1 day left, rose)
 *   4 = expired
 */
export function getWarningLevel(daysLeft: number | null): 0 | 1 | 2 | 3 | 4 {
  if (daysLeft === null) return 0;
  if (daysLeft < 0) return 4;
  if (daysLeft <= 1) return 3;
  if (daysLeft <= 3) return 2;
  if (daysLeft <= 7) return 1;
  return 0;
}
/**
 * Check merchant access based on BOTH subscription AND merchant status.
 *
 * Returns:
 *   - allowed: customer-facing access (can earn stamps, etc.)
 *   - canEdit: merchant can modify settings
 *   - reason: explanation for admin/merchant
 *   - merchantStatus: current admin control state
 */
export function checkMerchantAccess(merchant: {
  subscriptionStatus: string;
  trialEndsAt: Date | string | null;
  currentPeriodEndsAt: Date | string | null;
  merchantStatus?: string;
}): {
  allowed: boolean;
  canEdit: boolean;
  reason: string;
  merchantStatus: string;
} {
  const sub = evaluateSubscription(merchant);
  const mStatus = merchant.merchantStatus || "ACTIVE";

  // Admin controls take priority
  if (mStatus === "BLOCKED") {
    return {
      allowed: false,
      canEdit: false,
      reason: "Account blocked by administrator",
      merchantStatus: mStatus,
    };
  }
  if (mStatus === "REMOVED") {
    return {
      allowed: false,
      canEdit: false,
      reason: "Account removed",
      merchantStatus: mStatus,
    };
  }
  if (mStatus === "ON_HOLD") {
    return {
      allowed: false,
      canEdit: false,
      reason: "Account is on hold",
      merchantStatus: mStatus,
    };
  }

  // ACTIVE — check subscription
  return {
    allowed: sub.allowed,
    canEdit: sub.allowed,
    reason: sub.reason,
    merchantStatus: mStatus,
  };
}