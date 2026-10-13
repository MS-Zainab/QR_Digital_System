"use client";

import { useState } from "react";
import { useTheme } from "@/lib/useTheme";
import { FileText, Download, Users, Store, Stamp, Gift } from "lucide-react";
import { motion } from "framer-motion";

const REPORTS = [
  { key: "merchants", label: "All Merchants", icon: <Store size={18} />, desc: "Full merchant list with business details" },
  { key: "customers", label: "All Customers", icon: <Users size={18} />, desc: "Every customer across every merchant" },
  { key: "stamps", label: "Stamp Activity", icon: <Stamp size={18} />, desc: "All approved stamp requests" },
  { key: "redemptions", label: "Redemption History", icon: <Gift size={18} />, desc: "Every redeemed reward" },
];

export default function AdminReportsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (key: string) => {
    setDownloading(key);
    try {
      const endpoints: Record<string, string> = {
        merchants: "/api/admin/merchants?format=csv",
        customers: "/api/admin/customers?format=csv",
        stamps: "/api/admin/reports/stamps?format=csv",
        redemptions: "/api/admin/reports/redemptions?format=csv",
      };
      window.location.href = endpoints[key];
    } finally {
      setTimeout(() => setDownloading(null), 1500);
    }
  };

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className={`text-xl font-semibold ${textPrimary}`}>Reports</h2>
        <p className={`text-sm ${textMuted} mt-0.5`}>Download CSV exports of your data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REPORTS.map((r, i) => (
          <motion.div key={r.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-xl border ${cardBg} p-5`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 shrink-0">
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm ${textPrimary}`}>{r.label}</h3>
                <p className={`text-xs ${textMuted} mt-0.5`}>{r.desc}</p>
              </div>
            </div>
            <button onClick={() => handleDownload(r.key)} disabled={downloading === r.key}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50">
              <Download size={14} />
              {downloading === r.key ? "Downloading..." : "Download CSV"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}