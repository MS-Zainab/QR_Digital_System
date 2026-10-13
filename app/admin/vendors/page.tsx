"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Loader2, Search, RefreshCw, LogOut, MoreVertical,
  Ban, PauseCircle, PlayCircle, Trash2, AlertTriangle, Clock, ShieldCheck,
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";

interface Merchant {
  id: string;
  name: string;
  email: string;
  businessType?: string;
  subscriptionStatus: string;
  merchantStatus: string;
  trialEndsAt?: string;
  currentPeriodEndsAt?: string;
  holdReason?: string | null;
  blockReason?: string | null;
}

type FilterKey = "all" | "active" | "pending" | "expired" | "blocked";

export default function AdminVendorsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [pending, setPending] = useState<Merchant[]>([]);
  const [active, setActive] = useState<Merchant[]>([]);
  const [expired, setExpired] = useState<Merchant[]>([]);
  const [blocked, setBlocked] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
      setPending(data.pending || []);
      setActive(data.active || []);
      setExpired(data.expired || []);
      setBlocked(data.blocked || []);
    } catch {}
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const handleAction = async (merchantId: string, action: string) => {
    if (action === "remove" && !confirm("Permanently remove this merchant?")) return;
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}/${action}`, {
        method: "POST",
      });
      if (res.ok) {
        setToast(`${action} successful`);
        setTimeout(() => setToast(null), 3000);
        load();
      } else {
        setToast(`${action} failed`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Network error");
      setTimeout(() => setToast(null), 3000);
    }
    setOpenMenuId(null);
  };

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const filterList = (list: Merchant[]) =>
    list.filter(
      (m) =>
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    );

  const fActive = filterList(active);
  const fPending = filterList(pending);
  const fExpired = filterList(expired);
  const fBlocked = filterList(blocked);

  // Filter based on dropdown selection
  let visible: Merchant[] = [];
  let emptyMessage = "No merchants in this category.";
  if (filter === "all") {
    visible = [...fActive, ...fPending, ...fExpired, ...fBlocked];
  } else if (filter === "active") {
    visible = fActive;
    emptyMessage = "No active merchants.";
  } else if (filter === "pending") {
    visible = fPending;
    emptyMessage = "No pending merchants.";
  } else if (filter === "expired") {
    visible = fExpired;
    emptyMessage = "No expired merchants.";
  } else if (filter === "blocked") {
    visible = fBlocked;
    emptyMessage = "No blocked merchants.";
  }

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className={`text-xl font-semibold ${textPrimary}`}>Vendors</h2>
          <p className={`text-sm ${textMuted} mt-0.5`}>
            {fActive.length} active · {fPending.length} pending · {fExpired.length} expired · {fBlocked.length} blocked
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

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium"
        >
          {toast}
        </motion.div>
      )}

      {/* Search + Filter Row */}
      <div className={`rounded-xl border ${cardBg} p-3`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
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

          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterKey)}
            className={`px-3 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition ${
              isDark
                ? "bg-slate-950 border-slate-700 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
          >
            <option value="all">
              All Merchants ({fActive.length + fPending.length + fExpired.length + fBlocked.length})
            </option>
            <option value="active">Active ({fActive.length})</option>
            <option value="pending">Pending ({fPending.length})</option>
            <option value="expired">Expired ({fExpired.length})</option>
            <option value="blocked">Blocked ({fBlocked.length})</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
      ) : visible.length === 0 ? (
        <div className={`rounded-xl border ${cardBg} p-16 text-center`}>
          <Store className={`mx-auto mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`} size={48} />
          <p className={`text-sm ${textMuted}`}>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((m) => (
            <MerchantRow
              key={m.id}
              m={m}
              onAction={handleAction}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              isDark={isDark}
              actions={getActionsForMerchant(m, filter)}
              statusBadge={<StatusBadgeForMerchant m={m} isDark={isDark} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── */

// Determine which actions to show based on the merchant's state
function getActionsForMerchant(m: Merchant, filter: FilterKey): string[] {
  const isBlocked =
    m.merchantStatus === "ON_HOLD" ||
    m.merchantStatus === "BLOCKED" ||
    m.merchantStatus === "REMOVED" ||
    m.subscriptionStatus === "ON_HOLD" ||
    m.subscriptionStatus === "BLOCKED" ||
    m.subscriptionStatus === "CANCELLED";

  const isPending = m.subscriptionStatus === "PENDING_APPROVAL";

  if (isBlocked) return ["activate", "remove"];
  if (isPending) return ["activate", "block", "remove"];
  // Active or expired — show all actions
  return ["hold", "block", "remove"];
}

function StatusBadgeForMerchant({ m, isDark }: { m: Merchant; isDark: boolean }) {
  const status =
    m.merchantStatus === "ON_HOLD"
      ? "ON_HOLD"
      : m.merchantStatus === "BLOCKED"
      ? "BLOCKED"
      : m.merchantStatus === "REMOVED"
      ? "REMOVED"
      : m.subscriptionStatus;

  const config: Record<string, { bg: string; text: string; label: string }> = {
    TRIAL: { bg: "bg-blue-100", text: "text-blue-700", label: "Trial" },
    ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active" },
    EXPIRED: { bg: "bg-rose-100", text: "text-rose-700", label: "Expired" },
    PENDING_APPROVAL: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
    ON_HOLD: { bg: "bg-amber-100", text: "text-amber-700", label: "On Hold" },
    BLOCKED: { bg: "bg-rose-100", text: "text-rose-700", label: "Blocked" },
    CANCELLED: { bg: "bg-slate-200", text: "text-slate-700", label: "Cancelled" },
    REMOVED: { bg: "bg-slate-200", text: "text-slate-700", label: "Removed" },
  };
  const c = config[status] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    label: status,
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

function MerchantRow({
  m,
  onAction,
  openMenuId,
  setOpenMenuId,
  isDark,
  actions,
  statusBadge,
}: {
  m: Merchant;
  onAction: (id: string, a: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  isDark: boolean;
  actions: string[];
  statusBadge: React.ReactNode;
}) {
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const reason = m.holdReason || m.blockReason;

  return (
    <div className={`rounded-xl border ${cardBg} p-3.5 flex items-center justify-between gap-3 relative`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-medium text-sm ${textPrimary} truncate`}>{m.name}</p>
          {statusBadge}
        </div>
        <p className={`text-xs ${textMuted} truncate mt-0.5`}>
          {m.email} · {m.businessType || "—"}
        </p>
        {reason && <p className="text-[11px] text-rose-600 mt-0.5 truncate">{reason}</p>}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(openMenuId === m.id ? null : m.id);
        }}
        className={`p-1.5 rounded-lg transition ${
          isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
        }`}
      >
        <MoreVertical size={16} />
      </button>
      <AnimatePresence>
        {openMenuId === m.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute right-4 top-12 z-10 rounded-lg shadow-lg border min-w-[140px] ${
              isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
            }`}
          >
            {actions.includes("activate") && (
              <MenuItem icon={<PlayCircle size={14} />} label="Activate" onClick={() => onAction(m.id, "activate")} isDark={isDark} />
            )}
            {actions.includes("hold") && (
              <MenuItem icon={<PauseCircle size={14} />} label="Hold" onClick={() => onAction(m.id, "hold")} isDark={isDark} />
            )}
            {actions.includes("block") && (
              <MenuItem icon={<Ban size={14} />} label="Block" onClick={() => onAction(m.id, "block")} isDark={isDark} />
            )}
            {actions.includes("remove") && (
              <MenuItem icon={<Trash2 size={14} />} label="Remove" onClick={() => onAction(m.id, "remove")} isDark={isDark} danger />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  isDark,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isDark: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${
        danger
          ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          : isDark
          ? "text-slate-300 hover:bg-slate-800"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}