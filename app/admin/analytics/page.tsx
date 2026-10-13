"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  RefreshCw,
  Users,
  Store,
  ChevronDown,
  ChevronUp,
  ScanLine,
  Stamp,
  Gift,
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";

interface MerchantStat {
  id: string;
  name: string;
  email: string;
  status: string;
  totalCustomers: number;
  totalStamps: number;
  totalScans: number;
  totalRedemptions: number;
  growth30d: number;
  lastActivity: string | null;
}

interface PlatformSummary {
  totalMerchants: number;
  totalCustomers: number;
  totalStamps: number;
  totalScans: number;
  totalRedemptions: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [merchants, setMerchants] = useState<MerchantStat[]>([]);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof MerchantStat>("totalStamps");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/merchants");
      if (res.ok) {
        const data = await res.json();
        setMerchants(data.merchants || []);
        setSummary(data.summary || null);
      } else if (res.status === 403) {
        router.push("/admin/login");
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = (key: keyof MerchantStat) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...merchants].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const cardBg = isDark
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const textPrimary = isDark ? "text-white" : "text-slate-900";

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${textPrimary}`}>
            Merchant Analytics
          </h2>
          <p className={`text-sm ${textMuted} mt-0.5`}>
            Per-merchant performance · Click any row to expand
          </p>
        </div>
        <button
          onClick={load}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border ${
            isDark
              ? "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"
              : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
          }`}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Sortable Merchant Table */}
      <section className={`rounded-xl shadow-sm border ${cardBg} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              className={`${
                isDark ? "bg-slate-800/50" : "bg-slate-50"
              } border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
            >
              <tr>
                <Th
                  label="Merchant"
                  sortKey="name"
                  currentSort={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <Th
                  label="Customers"
                  sortKey="totalCustomers"
                  currentSort={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  align="right"
                />
                <Th
                  label="Stamps"
                  sortKey="totalStamps"
                  currentSort={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  align="right"
                />
                <Th
                  label="Scans"
                  sortKey="totalScans"
                  currentSort={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  align="right"
                />
                <Th
                  label="Redemptions"
                  sortKey="totalRedemptions"
                  currentSort={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  align="right"
                />
                <Th
                  label="Growth (30d)"
                  sortKey="growth30d"
                  currentSort={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  align="right"
                />
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => (
                <Fragment key={m.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() =>
                      setExpandedId(expandedId === m.id ? null : m.id)
                    }
                    className={`cursor-pointer border-b transition ${
                      isDark
                        ? "border-slate-800 hover:bg-slate-800/40"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className={`font-medium ${textPrimary} truncate`}>
                          {m.name}
                        </p>
                        <p className={`text-xs ${textMuted} truncate`}>
                          {m.email}
                        </p>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right ${textPrimary}`}>
                      {m.totalCustomers.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right ${textPrimary}`}>
                      {m.totalStamps.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right ${textPrimary}`}>
                      {m.totalScans.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right ${textPrimary}`}>
                      {m.totalRedemptions.toLocaleString()}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        m.growth30d >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {m.growth30d >= 0 ? "+" : ""}
                      {m.growth30d}%
                    </td>
                    <td className="px-2 py-3">
                      {expandedId === m.id ? (
                        <ChevronUp size={16} className={textMuted} />
                      ) : (
                        <ChevronDown size={16} className={textMuted} />
                      )}
                    </td>
                  </motion.tr>
                  {expandedId === m.id && (
                    <tr>
                      <td
                        colSpan={7}
                        className={`px-4 py-4 ${
                          isDark ? "bg-slate-800/30" : "bg-slate-50"
                        }`}
                      >
                        <MerchantDetail merchant={m} isDark={isDark} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className={`px-4 py-12 text-center ${textMuted}`}
                  >
                    No merchant data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Platform Summary (secondary) */}
      <section>
        <h3
          className={`text-xs font-semibold uppercase tracking-wider ${textMuted} mb-3`}
        >
          Platform Totals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SummaryCard
            icon={<Store size={18} />}
            label="Merchants"
            value={summary.totalMerchants}
            isDark={isDark}
          />
          <SummaryCard
            icon={<Users size={18} />}
            label="Customers"
            value={summary.totalCustomers}
            isDark={isDark}
          />
          <SummaryCard
            icon={<Stamp size={18} />}
            label="Stamps"
            value={summary.totalStamps}
            isDark={isDark}
          />
          <SummaryCard
            icon={<ScanLine size={18} />}
            label="Scans"
            value={summary.totalScans}
            isDark={isDark}
          />
          <SummaryCard
            icon={<Gift size={18} />}
            label="Redemptions"
            value={summary.totalRedemptions}
            isDark={isDark}
          />
        </div>
      </section>
    </div>
  );
}

/* ───────────────────────────────────── */

function Th({
  label,
  sortKey,
  currentSort,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: string;
  currentSort: string;
  dir: "asc" | "desc";
  onSort: (key: any) => void;
  align?: "left" | "right";
}) {
  const active = currentSort === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition ${
        align === "right" ? "text-right" : "text-left"
      } ${active ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (dir === "asc" ? "↑" : "↓")}
      </span>
    </th>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2 text-indigo-600 mb-2">{icon}</div>
      <p
        className={`text-2xl font-semibold ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        {value.toLocaleString()}
      </p>
      <p
        className={`text-xs font-medium mt-0.5 ${
          isDark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

function MerchantDetail({
  merchant,
  isDark,
}: {
  merchant: MerchantStat;
  isDark: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DetailCard label="Status" value={merchant.status} isDark={isDark} />
      <DetailCard
        label="Last Activity"
        value={
          merchant.lastActivity
            ? new Date(merchant.lastActivity).toLocaleDateString()
            : "—"
        }
        isDark={isDark}
      />
      <DetailCard
        label="Avg Stamps / Customer"
        value={
          merchant.totalCustomers > 0
            ? (merchant.totalStamps / merchant.totalCustomers).toFixed(1)
            : "0"
        }
        isDark={isDark}
      />
      <DetailCard
        label="Redemption Rate"
        value={
          merchant.totalStamps > 0
            ? `${((merchant.totalRedemptions / merchant.totalStamps) * 100).toFixed(1)}%`
            : "0%"
        }
        isDark={isDark}
      />
    </div>
  );
}

function DetailCard({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 ${
        isDark ? "bg-slate-800/50" : "bg-white border border-slate-200"
      }`}
    >
      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </p>
      <p
        className={`text-sm font-semibold mt-1 ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}