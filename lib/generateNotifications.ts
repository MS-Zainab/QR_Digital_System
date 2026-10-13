import { prisma } from "./prisma";
import {
  evaluateSubscription,
  getWarningLevel,
} from "./subscriptionGuard";

/**
 * Generate trial/subscription notifications for all merchants.
 * Only creates notifications when:
 *   - Merchant is near expiry (≤7 days) OR expired
 *   - No similar notification already sent in last 24h
 *
 * Returns a summary.
 */
export async function generateNotificationsForAllMerchants() {
  const merchants = await prisma.merchant.findMany({
    select: {
      id: true,
      name: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
    },
  });

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let created = 0;
  let skipped = 0;
  const details: { merchant: string; type: string }[] = [];

  for (const m of merchants) {
    const check = evaluateSubscription(m);

    // Skip pending/cancelled/blocked — not relevant
    if (
      check.status === "PENDING_APPROVAL" ||
      check.status === "BLOCKED" ||
      check.status === "CANCELLED"
    ) {
      skipped++;
      continue;
    }

    // Skip if not near expiry
    const level = getWarningLevel(check.daysLeft);
    if (level === 0) {
      skipped++;
      continue;
    }

    // Determine notification type + content
    let type: "TRIAL_WARNING" | "TRIAL_EXPIRED" | "SUBSCRIPTION_EXPIRING" | "SUBSCRIPTION_EXPIRED" | null =
      null;
    let title = "";
    let message = "";

    if (check.isExpired) {
      if (check.trialEndsAt && !check.isActive) {
        type = "TRIAL_EXPIRED";
        title = "Your trial has expired";
        message =
          "Your store is temporarily unavailable. Contact us to reactivate.";
      } else {
        type = "SUBSCRIPTION_EXPIRED";
        title = "Your subscription has expired";
        message =
          "Your store is temporarily unavailable. Contact us to reactivate.";
      }
    } else if (check.isTrial) {
      if (check.daysLeft === 0) {
        type = "TRIAL_WARNING";
        title = "⚠️ Trial ends today";
        message = "Last day of your free trial. Upgrade to continue.";
      } else if (check.daysLeft === 1) {
        type = "TRIAL_WARNING";
        title = "⚠️ Trial ends tomorrow";
        message = "Only 1 day left in your free trial.";
      } else if (check.daysLeft !== null && check.daysLeft <= 3) {
        type = "TRIAL_WARNING";
        title = `⚠️ ${check.daysLeft} days left in trial`;
        message = "Your free trial ends soon. Upgrade to continue.";
      } else if (check.daysLeft !== null && check.daysLeft <= 7) {
        type = "TRIAL_WARNING";
        title = `Free trial · ${check.daysLeft} days left`;
        message = "You're enjoying your free trial. Continue with a paid plan.";
      }
    } else if (check.isActive) {
      if (check.daysLeft !== null && check.daysLeft <= 3) {
        type = "SUBSCRIPTION_EXPIRING";
        title = `⚠️ Renewal in ${check.daysLeft} days`;
        message = "Your subscription renews soon.";
      }
    }

    if (!type) {
      skipped++;
      continue;
    }

    // Duplicate check: same merchant + same type in last 24h
    const recent = await prisma.notification.findFirst({
      where: {
        merchantId: m.id,
        type,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (recent) {
      skipped++;
      continue;
    }

    await prisma.notification.create({
      data: {
        merchantId: m.id,
        type,
        title,
        message,
      },
    });

    created++;
    details.push({ merchant: m.name, type });
  }

  return {
    totalScanned: merchants.length,
    created,
    skipped,
    details,
  };
}