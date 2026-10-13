"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import {
  hoursUntilPKTEnd,
  isExpiredPKT,
  formatPKTDate,
  calendarDaysLeftPKT,
} from "@/lib/pkTime";

interface Props {
  status: string;
  trialEndsAt: string | null;
  currentPeriodEndsAt?: string | null;
}

export default function TrialBanner({
  status,
  trialEndsAt,
  currentPeriodEndsAt,
}: Props) {
  // Determine which expiry applies
  const expiryDate =
    status === "TRIAL"
      ? trialEndsAt
      : status === "ACTIVE"
      ? currentPeriodEndsAt
      : null;

  if (!expiryDate) return null;

  const expired = isExpiredPKT(expiryDate);

  // Already expired → show expired banner
  if (expired) {
    return (
      <Banner
        color="rose"
        icon={<XCircle className="text-rose-600" size={20} />}
        title="Your subscription has expired"
        subtitle="Your store is temporarily unavailable to customers. Reactivate to continue."
        ctaText="Contact Us to Activate"
        ctaHref="/merchant/expired"
      />
    );
  }

  // Only show for trial
  if (status === "TRIAL") {
    // Compute calendar days left (date-based, not hours)
    const daysLeft = calendarDaysLeftPKT(expiryDate);
    const hoursLeft = hoursUntilPKTEnd(expiryDate);
    const expiryFormatted = formatPKTDate(expiryDate);

    // More than 7 days left → no banner
    if (daysLeft > 7) return null;

    // Trial ends TODAY (calendar date matches today in PKT)
    if (daysLeft === 0) {
      const hrs = Math.max(1, Math.floor(hoursLeft));
      return (
        <Banner
          color="rose"
          icon={<AlertTriangle className="text-rose-600" size={20} />}
          title="⚠️ Trial ends today"
          subtitle={`${hrs} hour${hrs === 1 ? "" : "s"} remaining`}
          ctaText="Upgrade Now"
          ctaHref="/merchant/expired"
        />
      );
    }

    // Trial ends TOMORROW (next calendar day in PKT)
    if (daysLeft === 1) {
      return (
        <Banner
          color="rose"
          icon={<AlertTriangle className="text-rose-600" size={20} />}
          title="⚠️ Trial ends tomorrow"
          subtitle={`Ends on ${expiryFormatted}`}
          ctaText="Upgrade Now"
          ctaHref="/merchant/expired"
        />
      );
    }

    // Trial ends in 2-3 days
    if (daysLeft <= 3) {
      return (
        <Banner
          color="amber"
          icon={<Clock className="text-amber-600" size={20} />}
          title={`⚠️ ${daysLeft} days left in your trial`}
          subtitle={`Ends on ${expiryFormatted}`}
          ctaText="View Plans"
          ctaHref="/merchant/expired"
        />
      );
    }

    // Trial ends in 4-7 days
    return (
      <Banner
        color="blue"
        icon={<Clock className="text-blue-600" size={20} />}
        title={`Free trial · ${daysLeft} days left`}
        subtitle={`Ends on ${expiryFormatted}`}
        ctaText="Learn More"
        ctaHref="/merchant/expired"
      />
    );
  }

  // For ACTIVE subscription (paid)
  if (status === "ACTIVE") {
    const daysLeft = calendarDaysLeftPKT(expiryDate);
    const expiryFormatted = formatPKTDate(expiryDate);

    if (daysLeft > 7) return null;

    if (daysLeft <= 3) {
      return (
        <Banner
          color="amber"
          icon={<Clock className="text-amber-600" size={20} />}
          title={`⚠️ Subscription renews in ${daysLeft} days`}
          subtitle={`Renews on ${expiryFormatted}`}
          ctaText="View Plan"
          ctaHref="/merchant/settings"
        />
      );
    }

    return null;
  }

  return null;
}

function Banner({
  color,
  icon,
  title,
  subtitle,
  ctaText,
  ctaHref,
}: {
  color: "blue" | "amber" | "rose";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
}) {
  const styles = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      button: "bg-slate-900 hover:bg-slate-800",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      text: "text-amber-900",
      button: "bg-slate-900 hover:bg-slate-800",
    },
    rose: {
      bg: "bg-rose-50",
      border: "border-rose-300",
      text: "text-rose-900",
      button: "bg-rose-600 hover:bg-rose-700",
    },
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${styles.bg} ${styles.border} border-2 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold ${styles.text} text-sm`}>{title}</p>
        <p className={`text-xs ${styles.text} opacity-80 mt-0.5 font-medium`}>
          {subtitle}
        </p>
      </div>
      <Link
        href={ctaHref}
        className={`${styles.button} text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition`}
      >
        {ctaText}
        <ArrowRight size={14} />
      </Link>
    </motion.div>
  );
}