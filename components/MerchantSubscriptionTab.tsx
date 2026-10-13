"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  TrendingUp,
  Loader2,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { daysUntilPKTEnd, formatPKTDate, isExpiredPKT } from "@/lib/pkTime";

interface SubscriptionInfo {
  subscriptionStatus: string;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  customPricePerMonth: number | null;
  subscriptionNotes: string | null;
  createdAt: string;
}

export default function MerchantSubscriptionTab({
  merchant,
  color,
}: {
  merchant: {
    id: string;
    name: string;
    subscriptionStatus: string;
    trialEndsAt: string;
    currentPeriodEndsAt?: string | null;
    customPricePerMonth?: number | null;
  };
  color: string;
}) {
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/merchant/${merchant.id}/subscription`);
        if (res.ok) {
          const data = await res.json();
          setInfo({
            subscriptionStatus: data.status,
            trialEndsAt: data.trialEndsAt,
            currentPeriodEndsAt: data.effectiveEndDate,
            customPricePerMonth: null,
            subscriptionNotes: null,
            createdAt: new Date().toISOString(),
          });
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [merchant.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={28} style={{ color }} />
      </div>
    );
  }

  const status = info?.subscriptionStatus || merchant.subscriptionStatus;
  const expiryDate =
    status === "TRIAL" ? merchant.trialEndsAt : info?.currentPeriodEndsAt;

  const isExpired = expiryDate ? isExpiredPKT(expiryDate) : false;
  const daysLeft = expiryDate ? daysUntilPKTEnd(expiryDate) : null;

  const statusConfig = getStatusConfig(status, isExpired);

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${color}20`, color }}
            >
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Current Plan
              </p>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                {statusConfig.planName}
              </h2>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${statusConfig.badgeClass}`}
          >
            {statusConfig.badgeIcon}
            {statusConfig.badgeText}
          </div>
        </div>

        {/* Progress bar for trial */}
        {status === "TRIAL" && daysLeft !== null && daysLeft >= 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-600">
                Trial Progress
              </p>
              <p
                className="text-xs font-bold"
                style={{ color }}
              >
                {daysLeft} day{daysLeft === 1 ? "" : "s"} left
              </p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(
                    5,
                    100 - (daysLeft / 15) * 100
                  )}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        )}

        {/* Billing details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
          <DetailItem
            icon={<Calendar size={16} />}
            label="Billing Cycle"
            value="MONTHLY"
            color={color}
          />
          <DetailItem
            icon={<Sparkles size={16} />}
            label="Amount Paid"
            value={
              status === "TRIAL"
                ? "0 PKR"
                : merchant.customPricePerMonth
                ? `${merchant.customPricePerMonth.toLocaleString()} PKR`
                : "—"
            }
            color={color}
          />
          <DetailItem
            icon={<Clock size={16} />}
            label={status === "TRIAL" ? "Trial Ends" : "Renews On"}
            value={
              expiryDate
                ? formatPKTDate(expiryDate)
                : "—"
            }
            color={color}
          />
        </div>
      </motion.section>

      {/* Upgrade / Contact card */}
      {status === "TRIAL" && (
        <section
          className="rounded-3xl p-6 border-2"
          style={{
            background: `${color}08`,
            borderColor: `${color}30`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: color, color: "white" }}
            >
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg mb-1">
                Continue with a paid plan
              </h3>
              <p className="text-sm text-slate-600 font-medium mb-4">
                {daysLeft !== null && daysLeft > 0
                  ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your trial. ` +
                    "Contact us to set up your monthly plan."
                  : "Your trial has ended. Contact us to reactivate your store."}
              </p>
              <div className="flex gap-2 flex-wrap">
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || ""}?text=${encodeURIComponent(
                    `Hi, I'd like to upgrade my QR Digital Loyalty account (${merchant.name})`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition"
                >
                  <MessageCircle size={16} />
                  Contact on WhatsApp
                </a>
                <a
                  href={`mailto:${
                    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || ""
                  }?subject=${encodeURIComponent(
                    `Upgrade inquiry from ${merchant.name}`
                  )}`}
                  className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-900 px-5 py-2.5 rounded-xl font-bold text-sm transition"
                >
                  <Mail size={16} />
                  Email Support
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Billing History placeholder */}
      <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} style={{ color }} />
          <h3 className="font-bold text-slate-900 text-base">
            Billing History
          </h3>
        </div>
        <div className="py-10 text-center border border-dashed border-slate-200 rounded-2xl">
          <Clock className="mx-auto text-slate-300 mb-2" size={32} />
          <p className="text-sm text-slate-500 font-medium">
            {status === "TRIAL"
              ? "No billing history yet — you're on the free trial."
              : "Billing history will appear here after your first payment."}
          </p>
        </div>
      </section>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2"
        style={{ color: `${color}cc` }}
      >
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function getStatusConfig(status: string, isExpired: boolean) {
  if (isExpired) {
    return {
      planName: "EXPIRED",
      badgeClass: "bg-rose-100 text-rose-700",
      badgeText: "Expired",
      badgeIcon: <XCircle size={14} />,
    };
  }
  switch (status) {
    case "TRIAL":
      return {
        planName: "TRIAL PLAN",
        badgeClass: "bg-blue-100 text-blue-700",
        badgeText: "Active Trial",
        badgeIcon: <Clock size={14} />,
      };
    case "ACTIVE":
      return {
        planName: "PAID PLAN",
        badgeClass: "bg-emerald-100 text-emerald-700",
        badgeText: "Active",
        badgeIcon: <CheckCircle2 size={14} />,
      };
    case "PENDING_APPROVAL":
      return {
        planName: "PENDING",
        badgeClass: "bg-amber-100 text-amber-700",
        badgeText: "Pending Review",
        badgeIcon: <AlertTriangle size={14} />,
      };
    case "BLOCKED":
      return {
        planName: "BLOCKED",
        badgeClass: "bg-rose-100 text-rose-700",
        badgeText: "Blocked",
        badgeIcon: <XCircle size={14} />,
      };
    default:
      return {
        planName: status,
        badgeClass: "bg-slate-100 text-slate-700",
        badgeText: status,
        badgeIcon: <Clock size={14} />,
      };
  }
}