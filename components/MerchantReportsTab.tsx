"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  BarChart3,
  Users,
  Gift,
  TrendingUp,
} from "lucide-react";

interface MonthlyReport {
  month: number; // 1-12
  year: number;
  label: string; // "October 2026"
  totalScans: number;
  uniqueCustomers: number;
  newCustomers: number;
  rewardsRedeemed: number;
  stampsIssued: number;
}

export default function MerchantReportsTab({
  merchantId,
  color,
}: {
  merchantId: string;
  color: string;
}) {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Custom date range state
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/merchant/${merchantId}/reports`);
        if (!res.ok) {
          setError("Failed to load reports");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setReports(data.reports || []);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [merchantId]);

  const downloadMonth = (report: MonthlyReport) => {
    const key = `${report.year}-${report.month}`;
    setDownloading(key);
    const url = `/api/merchant/${merchantId}/reports?format=csv&year=${report.year}&month=${report.month}`;
    window.location.href = url;
    setTimeout(() => setDownloading(null), 1500);
  };

  const downloadCustom = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date must be before end date");
      return;
    }
    setDownloading("custom");
    const url = `/api/merchant/${merchantId}/reports?format=csv&start=${startDate}&end=${endDate}`;
    window.location.href = url;
    setTimeout(() => setDownloading(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={28} style={{ color }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center">
        <AlertCircle className="mx-auto text-rose-500 mb-2" size={32} />
        <p className="text-sm text-rose-800 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Custom date range */}
      <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${color}20`, color }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Custom Date Range
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Download data for any specific period
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg transition"
            style={{
              background: showCustom ? `${color}20` : "#f1f5f9",
              color: showCustom ? color : "#64748b",
            }}
          >
            {showCustom ? "Hide" : "Show"}
          </button>
        </div>

        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap gap-3 items-end pt-2 border-t border-slate-100 mt-2"
          >
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={downloadCustom}
              disabled={downloading === "custom"}
              className="text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition disabled:opacity-50"
              style={{ background: color }}
            >
              {downloading === "custom" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Download CSV
            </button>
          </motion.div>
        )}
      </section>

      {/* Monthly reports */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} style={{ color }} />
          <h3 className="font-bold text-lg text-slate-900">
            Monthly Reports
          </h3>
          <span className="text-xs text-slate-500 font-semibold ml-auto">
            {reports.length} month{reports.length === 1 ? "" : "s"}
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-16 text-center border border-slate-200">
            <FileText className="mx-auto text-slate-300 mb-3" size={48} />
            <h3 className="font-bold text-lg text-slate-900 mb-1">
              No reports yet
            </h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
              Reports will appear here once you start getting visits.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <motion.div
                key={`${report.year}-${report.month}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Header */}
                <div
                  className="px-6 py-4 flex items-center justify-between flex-wrap gap-3"
                  style={{ background: `${color}10` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                      style={{ background: color, color: "white" }}
                    >
                      {report.month}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {report.label}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {report.totalScans} scans · {report.uniqueCustomers}{" "}
                        customers
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadMonth(report)}
                    disabled={
                      downloading === `${report.year}-${report.month}`
                    }
                    className="text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
                    style={{ background: color }}
                  >
                    {downloading === `${report.year}-${report.month}` ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    Download CSV
                  </button>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
                  <MonthStat
                    icon={<BarChart3 size={16} />}
                    label="Total Scans"
                    value={report.totalScans}
                    color={color}
                  />
                  <MonthStat
                    icon={<Users size={16} />}
                    label="Unique Customers"
                    value={report.uniqueCustomers}
                    color={color}
                  />
                  <MonthStat
                    icon={<TrendingUp size={16} />}
                    label="New Customers"
                    value={report.newCustomers}
                    color={color}
                  />
                  <MonthStat
                    icon={<Gift size={16} />}
                    label="Rewards Redeemed"
                    value={report.rewardsRedeemed}
                    color={color}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MonthStat({
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
    <div>
      <div
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2"
        style={{ background: `${color}15`, color }}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
    </div>
  );
}