"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Store, Users, Stamp, ScanLine, Gift, TrendingUp,
  Loader2, RefreshCw, LogOut, ArrowRight, Bell, Sparkles,
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { createClient } from "@/lib/supabase/client";

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

export default function AdminOverviewPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [merchants, setMerchants] = useState<MerchantStat[]>([]);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/merchants");
      if (res.status === 403) { router.push("/admin/login"); return; }
      if (!res.ok) return;
      const data = await res.json();
      setMerchants(data.merchants || []);
      setSummary(data.summary || null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const textPrimary = isDark ? "text-white" : "text-slate-900";

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    );
  }

  const topMerchants = [...merchants]
    .sort((a, b) => b.totalStamps - a.totalStamps)
    .slice(0, 5);

  const recentlyActive = [...merchants]
    .filter((m) => m.lastActivity)
    .sort((a, b) =>
      new Date(b.lastActivity!).getTime() - new Date(a.lastActivity!).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h2 className={`text-xl font-semibold ${textPrimary}`}>Platform Overview</h2>
          <p className={`text-sm ${textMuted} mt-0.5`}>
            Real-time snapshot of your platform
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={load}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border ${
              isDark
                ? "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"
                : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={handleLogout}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border ${
              isDark
                ? "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"
                : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <section>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${textMuted} mb-3`}>
          Platform Totals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SummaryCard icon={<Store size={18} />} label="Merchants" value={summary.totalMerchants} isDark={isDark} />
          <SummaryCard icon={<Users size={18} />} label="Customers" value={summary.totalCustomers} isDark={isDark} />
          <SummaryCard icon={<Stamp size={18} />} label="Stamps" value={summary.totalStamps} isDark={isDark} />
          <SummaryCard icon={<ScanLine size={18} />} label="Scans" value={summary.totalScans} isDark={isDark} />
          <SummaryCard icon={<Gift size={18} />} label="Redemptions" value={summary.totalRedemptions} isDark={isDark} />
        </div>
      </section>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Merchants */}
        <section className={`rounded-xl border ${cardBg} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
              <TrendingUp className="text-indigo-600" size={18} />
            </div>
            <h3 className={`font-semibold text-sm ${textPrimary}`}>
              Top Merchants by Stamps
            </h3>
            <Link
              href="/admin/analytics"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 ml-auto flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {topMerchants.length === 0 ? (
            <p className={`text-sm ${textMuted} text-center py-6`}>No data</p>
          ) : (
            <div className="space-y-2">
              {topMerchants.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${
                    isDark ? "bg-slate-800/50" : "bg-slate-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm ${textPrimary} truncate`}>{m.name}</p>
                    <p className={`text-xs ${textMuted} truncate`}>{m.totalCustomers} customers</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${textPrimary}`}>{m.totalStamps}</p>
                    <p className={`text-[10px] ${textMuted} uppercase tracking-wider`}>stamps</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recently Active */}
        <section className={`rounded-xl border ${cardBg} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <Bell className="text-emerald-600" size={18} />
            </div>
            <h3 className={`font-semibold text-sm ${textPrimary}`}>
              Recently Active Merchants
            </h3>
            <span className={`text-xs ${textMuted} ml-auto`}>By last activity</span>
          </div>

          {recentlyActive.length === 0 ? (
            <p className={`text-sm ${textMuted} text-center py-6`}>No activity yet</p>
          ) : (
            <div className="space-y-2">
              {recentlyActive.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${
                    isDark ? "bg-slate-800/50" : "bg-slate-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm ${textPrimary} truncate`}>{m.name}</p>
                    <p className={`text-xs ${textMuted} truncate`}>
                      {m.totalScans} scans · {m.totalRedemptions} redeemed
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-medium ${textPrimary}`}>
                      {m.lastActivity
                        ? new Date(m.lastActivity).toLocaleDateString("en-PK", {
                            timeZone: "Asia/Karachi",
                            day: "2-digit",
                            month: "short",
                          })
                        : "—"}
                    </p>
                    <p className={`text-[10px] ${textMuted} uppercase tracking-wider`}>last</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick Links */}
      <section>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${textMuted} mb-3`}>
          Quick Links
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickLink href="/admin/vendors" icon={<Store size={18} />} label="Manage Vendors" desc="Hold, block, activate merchants" isDark={isDark} />
          <QuickLink href="/admin/subscriptions" icon={<Sparkles size={18} />} label="Subscriptions" desc="Edit plans, extend trials" isDark={isDark} />
          <QuickLink href="/admin/customers" icon={<Users size={18} />} label="Customers" desc="View per-merchant history" isDark={isDark} />
          <QuickLink href="/admin/reports" icon={<Gift size={18} />} label="Reports" desc="Download CSV exports" isDark={isDark} />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon, label, value, isDark,
}: {
  icon: React.ReactNode; label: string; value: number; isDark: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2 text-indigo-600 mb-2">{icon}</div>
      <p className={`text-2xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
        {value.toLocaleString()}
      </p>
      <p className={`text-xs font-medium mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </p>
    </motion.div>
  );
}

function QuickLink({
  href, icon, label, desc, isDark,
}: {
  href: string; icon: React.ReactNode; label: string; desc: string; isDark: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-4 transition block ${
        isDark
          ? "bg-slate-900 border-slate-800 hover:bg-slate-800"
          : "bg-white border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-2 text-indigo-600 mb-2">{icon}</div>
      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
        {label}
      </p>
      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {desc}
      </p>
    </Link>
  );
}