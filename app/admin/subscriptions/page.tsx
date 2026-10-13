"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Loader2, RefreshCw, LogOut, Search, X, Save,
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";

interface Merchant {
  id: string;
  name: string;
  email: string;
  businessType?: string;
  subscriptionStatus: string;
  merchantStatus: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  currentPeriodEndsAt?: string;
  customPricePerMonth?: number | null;
  subscriptionNotes?: string | null;
  holdReason?: string | null;
  createdAt?: string;
}

const formatPKTDate = (date?: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PK", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// 🗓️ Get months from signup → today, capped at 12 (rolling)
function getMonthsForMerchant(m: Merchant) {
  const startISO = m.trialStartedAt || m.createdAt || new Date().toISOString();
  const start = new Date(startISO);
  const now = new Date();

  // Months between signup and now (inclusive)
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    1;

  // Total months to show = min(elapsed, 12)
  const totalMonths = Math.min(Math.max(monthsElapsed, 1), 12);

  // If more than 12 months have passed, roll the window forward
  const startOffset = Math.max(0, monthsElapsed - 12);

  const months: {
    key: string;
    label: string;
    year: number;
    month: number;
    start: Date;
    end: Date;
  }[] = [];

  for (let i = 0; i < totalMonths; i++) {
    const monthIndex = startOffset + i;
    const d = new Date(start.getFullYear(), start.getMonth() + monthIndex, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-PK", { month: "short", year: "numeric" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      start: d,
      end: nextMonth,
    });
  }
  return months;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/merchants");
      if (!res.ok) {
        if (res.status === 403) router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setMerchants([
        ...(data.pending || []),
        ...(data.active || []),
        ...(data.expired || []),
        ...(data.blocked || []),
      ]);
    } catch {}
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const handleSave = async (updates: Partial<Merchant>) => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/merchants/${editing.id}/update-subscription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      if (res.ok) {
        setToast("Subscription updated");
        setEditing(null);
        load();
      } else {
        setToast("Update failed");
      }
    } catch {
      setToast("Network error");
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = merchants.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const cardBg = isDark
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className={`text-xl font-semibold ${textPrimary}`}>
            Subscriptions
          </h2>
          <p className={`text-sm ${textMuted} mt-0.5`}>
            {filtered.length} merchants · All times shown in Pakistan Standard
            Time (PKT)
          </p>
        </div>
        <div className="flex gap-2">
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

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium"
        >
          {toast}
        </motion.div>
      )}

      <div className={`rounded-xl border ${cardBg} p-3`}>
        <div className="relative">
          <Search
            size={16}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchants..."
            className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              isDark
                ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                : "bg-white border-slate-300 text-slate-900"
            }`}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`rounded-xl border ${cardBg} p-16 text-center`}>
          <CreditCard
            className={`mx-auto mb-3 ${
              isDark ? "text-slate-700" : "text-slate-300"
            }`}
            size={48}
          />
          <p className={`text-sm ${textMuted}`}>No subscriptions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const months = getMonthsForMerchant(m);
            return (
              <div key={m.id} className={`rounded-xl border ${cardBg} p-4`}>
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium text-sm ${textPrimary}`}>
                        {m.name}
                      </h3>
                      <SubStatusBadge status={m.subscriptionStatus} />
                      {m.merchantStatus !== "ACTIVE" && (
                        <MerchantStatusBadge status={m.merchantStatus} />
                      )}
                    </div>
                    <p className={`text-xs ${textMuted} mt-0.5`}>{m.email}</p>
                  </div>
                  <button
                    onClick={() => setEditing(m)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                  <div>
                    <p className={textMuted}>Trial ends</p>
                    <p className={`font-medium ${textPrimary} mt-0.5`}>
                      {formatPKTDate(m.trialEndsAt)}
                    </p>
                  </div>
                  <div>
                    <p className={textMuted}>Current period ends</p>
                    <p className={`font-medium ${textPrimary} mt-0.5`}>
                      {formatPKTDate(m.currentPeriodEndsAt)}
                    </p>
                  </div>
                  <div>
                    <p className={textMuted}>Price/month</p>
                    <p className={`font-medium ${textPrimary} mt-0.5`}>
                      {m.customPricePerMonth
                        ? `PKR ${m.customPricePerMonth.toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className={textMuted}>Type</p>
                    <p className={`font-medium ${textPrimary} mt-0.5 capitalize`}>
                      {m.businessType || "—"}
                    </p>
                  </div>
                </div>

                {/* Rolling months view */}
                <div className="mt-4">
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted} mb-1.5`}
                  >
                    Subscription History · {months.length} month
                    {months.length !== 1 ? "s" : ""} since{" "}
                    {formatPKTDate(m.trialStartedAt || m.createdAt)}
                  </p>
                  <div className="flex gap-1">
                    {months.map((mo) => {
                      const now = new Date();
                      const isCurrent = now >= mo.start && now < mo.end;
                      const isPast = now >= mo.end;

                      let barColor = isDark ? "bg-slate-800" : "bg-slate-100";
                      if (isCurrent) barColor = "bg-indigo-600";
                      else if (
                        isPast &&
                        (m.subscriptionStatus === "ACTIVE" ||
                          m.subscriptionStatus === "TRIAL")
                      )
                        barColor = "bg-emerald-400";
                      else if (isPast && m.subscriptionStatus === "EXPIRED")
                        barColor = "bg-rose-300";

                      return (
                        <div
                          key={mo.key}
                          className="flex-1 text-center min-w-0"
                        >
                          <div
                            className={`h-6 rounded transition ${barColor}`}
                          />
                          <p
                            className={`text-[9px] mt-1 truncate ${
                              isCurrent
                                ? "text-indigo-600 font-bold"
                                : textMuted
                            }`}
                          >
                            {mo.label.split(" ")[0]}
                          </p>
                          <p className={`text-[8px] ${textMuted}`}>
                            {mo.year}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <EditModal
            merchant={editing}
            onClose={() => setEditing(null)}
            onSave={handleSave}
            saving={saving}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditModal({
  merchant,
  onClose,
  onSave,
  saving,
  isDark,
}: {
  merchant: Merchant;
  onClose: () => void;
  onSave: (u: Partial<Merchant>) => void;
  saving: boolean;
  isDark: boolean;
}) {
  const [trialEndsAt, setTrialEndsAt] = useState(
    merchant.trialEndsAt
      ? new Date(merchant.trialEndsAt).toISOString().slice(0, 10)
      : ""
  );
  const [currentPeriodEndsAt, setCurrentPeriodEndsAt] = useState(
    merchant.currentPeriodEndsAt
      ? new Date(merchant.currentPeriodEndsAt).toISOString().slice(0, 10)
      : ""
  );
  const [price, setPrice] = useState(
    merchant.customPricePerMonth?.toString() || ""
  );
  const [notes, setNotes] = useState(merchant.subscriptionNotes || "");
  const [status, setStatus] = useState(merchant.subscriptionStatus);

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const inputBg = isDark
    ? "bg-slate-800 border-slate-700 text-white"
    : "bg-white border-slate-300 text-slate-900";

  const handleSave = () => {
    onSave({
      trialEndsAt: trialEndsAt
        ? new Date(`${trialEndsAt}T23:59:59+05:00`).toISOString()
        : null,
      currentPeriodEndsAt: currentPeriodEndsAt
        ? new Date(`${currentPeriodEndsAt}T23:59:59+05:00`).toISOString()
        : null,
      customPricePerMonth: price ? parseInt(price, 10) : null,
      subscriptionNotes: notes || null,
      subscriptionStatus: status,
    } as any);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className={`rounded-xl border max-w-lg w-full p-5 ${
          isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>
              Edit Subscription
            </h3>
            <p className={`text-xs ${textMuted} mt-0.5`}>
              {merchant.name} · {merchant.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${textMuted}`}
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider ${textMuted} mb-1.5`}
            >
              Subscription Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${inputBg}`}
            >
              <option value="TRIAL">TRIAL</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider ${textMuted} mb-1.5`}
            >
              Trial Ends (PKT)
            </label>
            <input
              type="date"
              value={trialEndsAt}
              onChange={(e) => setTrialEndsAt(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${inputBg}`}
            />
          </div>

          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider ${textMuted} mb-1.5`}
            >
              Current Period Ends (PKT)
            </label>
            <input
              type="date"
              value={currentPeriodEndsAt}
              onChange={(e) => setCurrentPeriodEndsAt(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${inputBg}`}
            />
          </div>

          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider ${textMuted} mb-1.5`}
            >
              Price / Month (PKR)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 5000"
              className={`w-full px-3 py-2 rounded-lg border text-sm ${inputBg}`}
            />
          </div>

          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider ${textMuted} mb-1.5`}
            >
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this subscription..."
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${inputBg}`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              isDark
                ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                : "border-slate-300 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SubStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    TRIAL: { bg: "bg-blue-100", text: "text-blue-700", label: "Trial" },
    ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active" },
    EXPIRED: { bg: "bg-rose-100", text: "text-rose-700", label: "Expired" },
    PENDING_APPROVAL: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      label: "Pending",
    },
    ON_HOLD: { bg: "bg-amber-100", text: "text-amber-700", label: "On Hold" },
    BLOCKED: { bg: "bg-rose-100", text: "text-rose-700", label: "Blocked" },
    CANCELLED: {
      bg: "bg-slate-200",
      text: "text-slate-700",
      label: "Cancelled",
    },
  };
  const c = config[status] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    label: status,
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

function MerchantStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    ON_HOLD: { bg: "bg-amber-100", text: "text-amber-700", label: "Held" },
    BLOCKED: { bg: "bg-rose-100", text: "text-rose-700", label: "Blocked" },
    REMOVED: { bg: "bg-slate-200", text: "text-slate-700", label: "Removed" },
  };
  const c = config[status];
  if (!c) return null;
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}