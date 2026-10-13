"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  UserPlus,
  UserMinus,
  Gift,
  Award,
  Loader2,
  AlertCircle,
  Sparkles,
  Phone,
} from "lucide-react";

interface Insights {
  totalCustomers: number;
  stampsRequired: number;
  averages: {
    avgVisits: number;
    avgStamps: number;
  };
  topCustomers: {
    name: string | null;
    phoneNumber: string;
    totalVisits: number;
    totalRedemptions: number;
    stampCount: number;
  }[];
  newCustomers: {
    name: string | null;
    phoneNumber: string;
    joinedAt: string;
    totalVisits: number;
  }[];
  inactiveCustomers: {
    name: string | null;
    phoneNumber: string;
    lastVisit: string;
    totalVisits: number;
  }[];
  almostRewarded: {
    name: string | null;
    phoneNumber: string;
    stampCount: number;
    remaining: number;
  }[];
  rewardReady: {
    name: string | null;
    phoneNumber: string;
    stampCount: number;
  }[];
}

export default function MerchantAnalyticsTab({
  merchantId,
  color,
}: {
  merchantId: string;
  color: string;
}) {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/merchant/${merchantId}/analytics/insights`
        );
        if (!res.ok) {
          setError("Failed to load analytics");
          setLoading(false);
          return;
        }
        const d = await res.json();
        setData(d);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [merchantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={28} style={{ color }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center">
        <AlertCircle className="mx-auto text-rose-500 mb-2" size={32} />
        <p className="text-sm text-rose-800 font-semibold">
          {error || "Failed to load analytics"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Users size={22} />}
          label="Total Customers"
          value={data.totalCustomers}
          color={color}
        />
        <SummaryCard
          icon={<TrendingUp size={22} />}
          label="Avg Visits / Customer"
          value={data.averages.avgVisits}
          color={color}
        />
        <SummaryCard
          icon={<Sparkles size={22} />}
          label="Avg Stamps / Customer"
          value={data.averages.avgStamps}
          color={color}
        />
      </div>

      {/* Reward ready */}
      {data.rewardReady.length > 0 && (
        <Section
          title="🎁 Reward Ready"
          subtitle={`${data.rewardReady.length} customer${data.rewardReady.length === 1 ? "" : "s"} waiting to redeem`}
          icon={<Gift size={18} />}
          color={color}
          highlight
        >
          <div className="space-y-2">
            {data.rewardReady.slice(0, 5).map((c) => (
              <CustomerRow
                key={c.phoneNumber}
                name={c.name}
                phone={c.phoneNumber}
                badge={`${c.stampCount}/${data.stampsRequired}`}
                badgeColor={color}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Almost rewarded */}
      {data.almostRewarded.length > 0 && (
        <Section
          title="🎯 Almost There"
          subtitle={`${data.almostRewarded.length} customer${data.almostRewarded.length === 1 ? "" : "s"} need 1-2 more stamps`}
          icon={<Award size={18} />}
          color={color}
        >
          <div className="space-y-2">
            {data.almostRewarded.slice(0, 5).map((c) => (
              <CustomerRow
                key={c.phoneNumber}
                name={c.name}
                phone={c.phoneNumber}
                badge={`${c.remaining} to go`}
                badgeColor="#d97706"
              />
            ))}
          </div>
        </Section>
      )}

      {/* Top customers */}
      <Section
        title="⭐ Top Customers"
        subtitle="Most loyal visitors to your store"
        icon={<TrendingUp size={18} />}
        color={color}
      >
        {data.topCustomers.length === 0 ? (
          <EmptyRow message="No customers yet" />
        ) : (
          <div className="space-y-2">
            {data.topCustomers.slice(0, 10).map((c, idx) => (
              <CustomerRow
                key={c.phoneNumber}
                rank={idx + 1}
                name={c.name}
                phone={c.phoneNumber}
                badge={`${c.totalVisits} visits`}
                badgeColor="#059669"
              />
            ))}
          </div>
        )}
      </Section>

      {/* New this month */}
      {data.newCustomers.length > 0 && (
        <Section
          title="✨ New This Month"
          subtitle={`${data.newCustomers.length} new customer${data.newCustomers.length === 1 ? "" : "s"} joined`}
          icon={<UserPlus size={18} />}
          color={color}
        >
          <div className="space-y-2">
            {data.newCustomers.slice(0, 5).map((c) => (
              <CustomerRow
                key={c.phoneNumber}
                name={c.name}
                phone={c.phoneNumber}
                badge={formatDate(c.joinedAt)}
                badgeColor="#4f46e5"
              />
            ))}
          </div>
        </Section>
      )}

      {/* Inactive */}
      {data.inactiveCustomers.length > 0 && (
        <Section
          title="💤 Inactive Customers"
          subtitle={`${data.inactiveCustomers.length} haven't visited in 30+ days`}
          icon={<UserMinus size={18} />}
          color={color}
        >
          <div className="space-y-2">
            {data.inactiveCustomers.slice(0, 5).map((c) => (
              <CustomerRow
                key={c.phoneNumber}
                name={c.name}
                phone={c.phoneNumber}
                badge={`Last: ${formatDate(c.lastVisit)}`}
                badgeColor="#dc2626"
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────── */

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200"
    >
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-2xl mb-2"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600 mt-0.5 font-semibold">{label}</p>
    </motion.div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  color,
  highlight,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`bg-white rounded-3xl shadow-sm p-6 border ${
        highlight ? "border-2" : "border-slate-200"
      }`}
      style={{
        borderColor: highlight ? `${color}40` : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function CustomerRow({
  rank,
  name,
  phone,
  badge,
  badgeColor,
}: {
  rank?: number;
  name: string | null;
  phone: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-50 border border-slate-100">
      {rank !== undefined && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: badgeColor }}
        >
          {rank}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-slate-900 truncate">
          {name || "Unknown"}
        </p>
        <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
          <Phone size={10} />
          {phone}
        </p>
      </div>
      <span
        className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
        style={{
          background: `${badgeColor}20`,
          color: badgeColor,
        }}
      >
        {badge}
      </span>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <p className="text-sm text-slate-500 text-center py-6 font-medium bg-slate-50 rounded-xl">
      {message}
    </p>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}