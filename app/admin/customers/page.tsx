"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Loader2,
  Search,
  Download,
  Phone,
  CheckCircle2,
  XCircle,
  Store,
  LogOut,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Stamp,
  Gift,
  Calendar,
} from "lucide-react";

interface HistoryItem {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantColor: string;
  at: string;
  stampCount?: number;
  isRedeemed?: boolean;
  rewardText?: string;
  notes?: string | null;
}

interface Customer {
  customerId: string;
  name: string | null;
  phoneNumber: string;
  marketingConsent: boolean;
  joinedAt: string;
  merchants: {
    id: string;
    name: string;
    color: string;
    stampCount: number;
    isRedeemed: boolean;
  }[];
  history: {
    stamps: HistoryItem[];
    scans: HistoryItem[];
    redemptions: HistoryItem[];
  };
}

interface MerchantOption {
  id: string;
  name: string;
  group: "active" | "pending" | "expired" | "blocked";
}

export default function AdminCustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [optedIn, setOptedIn] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadMerchants = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/merchants");
      if (!res.ok) return;
      const data = await res.json();
      const grouped: MerchantOption[] = [
        ...(data.active || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          group: "active" as const,
        })),
        ...(data.pending || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          group: "pending" as const,
        })),
        ...(data.expired || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          group: "expired" as const,
        })),
        ...(data.blocked || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          group: "blocked" as const,
        })),
      ];
      setMerchants(grouped);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedMerchant) params.set("merchantId", selectedMerchant);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (!res.ok) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
      setOptedIn(data.optedIn || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search, selectedMerchant, router]);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (selectedMerchant) params.set("merchantId", selectedMerchant);
    params.set("format", "csv");
    window.location.href = `/api/admin/customers?${params.toString()}`;
  };

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // Group customers by top merchant (highest stampCount)
  const grouped = customers.reduce((acc, c) => {
    const top = c.merchants.reduce(
      (best, m) => (m.stampCount > (best?.stampCount ?? -1) ? m : best),
      c.merchants[0]
    );
    const key = top?.name || "Unknown";
    const color = top?.color || "#4f46e5";
    if (!acc[key]) acc[key] = { color, customers: [] };
    acc[key].customers.push(c);
    return acc;
  }, {} as Record<string, { color: string; customers: Customer[] }>);

  // Split merchants by status for dropdown optgroups
  const activeM = merchants.filter((m) => m.group === "active");
  const pendingM = merchants.filter((m) => m.group === "pending");
  const expiredM = merchants.filter((m) => m.group === "expired");
  const blockedM = merchants.filter((m) => m.group === "blocked");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} total · {optedIn} opted in · Click any customer to view full history
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={load}
            className="px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white border-slate-200 p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition bg-white border-slate-300 text-slate-900"
            />
          </div>

          <select
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition bg-white border-slate-300 text-slate-900"
          >
            <option value="">All Merchants</option>
            {activeM.length > 0 && (
              <optgroup label="✅ Active">
                {activeM.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            )}
            {pendingM.length > 0 && (
              <optgroup label="⏳ Pending">
                {pendingM.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            )}
            {expiredM.length > 0 && (
              <optgroup label="⚠️ Expired">
                {expiredM.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            )}
            {blockedM.length > 0 && (
              <optgroup label="🚫 Blocked">
                {blockedM.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Customer list — grouped by merchant */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border bg-white border-slate-200 p-16 text-center">
          <Users className="mx-auto mb-3 text-slate-300" size={48} />
          <h3 className="font-semibold text-base text-slate-900 mb-1.5">
            No customers yet
          </h3>
          <p className="text-sm text-slate-500">
            {search || selectedMerchant
              ? "No customers match your filters."
              : "Customers will appear here once they visit any merchant."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([merchantName, group]) => (
            <div key={merchantName}>
              {/* Merchant group header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: `${group.color}20`, color: group.color }}
                >
                  <Store size={13} />
                </div>
                <h3 className="font-semibold text-sm text-slate-900">
                  {merchantName}
                </h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {group.customers.length}
                </span>
              </div>

              <div className="space-y-2">
                {group.customers.map((c) => {
                  const isExpanded = expandedId === c.customerId;
                  const totalStamps = c.history.stamps.reduce(
                    (s, x) => s + (x.stampCount || 0),
                    0
                  );
                  return (
                    <div
                      key={c.customerId}
                      className="rounded-xl border bg-white border-slate-200 overflow-hidden"
                    >
                      {/* Customer row */}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : c.customerId)
                        }
                        className="w-full flex items-start gap-3 p-4 text-left transition hover:bg-slate-50"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                          {(c.name || c.phoneNumber).slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-sm text-slate-900 truncate">
                              {c.name || "Unknown"}
                            </h3>
                            {c.marketingConsent ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                <CheckCircle2 size={10} />
                                Opted In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                <XCircle size={10} />
                                No Opt-in
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Phone size={11} />
                            <span className="font-mono">{c.phoneNumber}</span>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-2 text-xs">
                            <span className="font-medium text-slate-700">
                              {totalStamps} stamps
                            </span>
                            <span className="text-emerald-600 font-medium">
                              {c.history.redemptions.length} redeemed
                            </span>
                            <span className="text-indigo-600 font-medium">
                              {c.merchants.length} merchant
                              {c.merchants.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 pt-1">
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-500" />
                          )}
                        </div>
                      </button>

                      {/* Expanded history */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
                              {/* Cards (per merchant) */}
                              <div className="mb-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                  Loyalty Cards
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {c.merchants.map((m) => (
                                    <div
                                      key={m.id}
                                      className="rounded-lg border p-2.5 bg-white border-slate-200"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ background: m.color }}
                                        />
                                        <p className="text-xs font-medium text-slate-900 truncate">
                                          {m.name}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <Stamp size={12} className="text-indigo-600" />
                                        <span className="text-xs font-semibold text-slate-900">
                                          {m.stampCount} stamps
                                        </span>
                                        {m.isRedeemed && (
                                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                            Redeemed
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Stamp History */}
                              {c.history.stamps.length > 0 && (
                                <HistorySection
                                  title="Stamp History"
                                  icon={<Stamp size={12} />}
                                  items={c.history.stamps}
                                  renderMeta={(item) => (
                                    <span className="text-indigo-600 font-medium">
                                      +{item.stampCount} stamps
                                      {item.isRedeemed && " · redeemed"}
                                    </span>
                                  )}
                                />
                              )}

                              {/* Redemption History */}
                              {c.history.redemptions.length > 0 && (
                                <HistorySection
                                  title="Redemption History"
                                  icon={<Gift size={12} />}
                                  items={c.history.redemptions}
                                  renderMeta={(item) => (
                                    <span className="text-emerald-600 font-medium">
                                      {item.rewardText}
                                    </span>
                                  )}
                                />
                              )}

                              {/* Empty state */}
                              {c.history.stamps.length === 0 &&
                                c.history.redemptions.length === 0 && (
                                  <p className="text-xs text-slate-500 text-center py-4">
                                    No activity yet
                                  </p>
                                )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────── */

function HistorySection({
  title,
  icon,
  items,
  renderMeta,
}: {
  title: string;
  icon: React.ReactNode;
  items: HistoryItem[];
  renderMeta: (item: HistoryItem) => React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
        {icon}
        {title} · {items.length}
      </p>
      <div className="space-y-1.5">
        {items.slice(0, 10).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-xs bg-white"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: item.merchantColor }}
              />
              <span className="text-slate-900 font-medium truncate">
                {item.merchantName}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {renderMeta(item)}
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(item.at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        {items.length > 10 && (
          <p className="text-[11px] text-slate-500 text-center pt-1">
            + {items.length - 10} more
          </p>
        )}
      </div>
    </div>
  );
}