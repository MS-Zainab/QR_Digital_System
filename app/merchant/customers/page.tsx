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
  User,
  Gift,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CustomerHistoryDrawer from "@/components/CustomerHistoryDrawer";

interface CustomerRow {
  cardId: string;
  customerId: string;
  name: string | null;
  phoneNumber: string;
  stampCount: number;
  totalVisits: number;
  totalRedemptions: number;
  marketingConsent: boolean;
  lastVisit: string;
  joinedAt: string;
}

interface Merchant {
  id: string;
  name: string;
  primaryColor: string;
  stampsRequired: number;
}

type Filter = "all" | "opted-in" | "recent" | "inactive";

export default function MerchantCustomersPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [total, setTotal] = useState(0);
  const [optedIn, setOptedIn] = useState(0);
  const [openCustomerId, setOpenCustomerId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/merchant/login");
        return;
      }
      const res = await fetch(
        `/api/merchant/by-email?email=${encodeURIComponent(user.email!)}`
      );
      if (!res.ok) {
        router.push("/merchant/login");
        return;
      }
      const m = await res.json();
      setMerchant(m);
      document.title = `Customers · ${m.name}`;
    }
    load();
  }, [router]);

  const loadCustomers = useCallback(async () => {
    if (!merchant) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);

      const res = await fetch(
        `/api/merchant/${merchant.id}/customers?${params.toString()}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
      setOptedIn(data.optedIn || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [merchant, search, filter]);

  useEffect(() => {
    if (!merchant) return;
    const t = setTimeout(loadCustomers, 300);
    return () => clearTimeout(t);
  }, [merchant, loadCustomers]);

  const handleExport = () => {
    if (!merchant) return;
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    params.set("format", "csv");
    window.location.href = `/api/merchant/${merchant.id}/customers?${params.toString()}`;
  };

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "opted-in", label: "Opted In" },
    { value: "recent", label: "Recent (7d)" },
    { value: "inactive", label: "Inactive (30d)" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div
        style={{
          background: `linear-gradient(135deg, ${merchant.primaryColor}, ${merchant.primaryColor}dd)`,
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <button
                onClick={() => router.push("/merchant/dashboard")}
                className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-semibold mb-3 transition"
              >
                <ArrowLeft size={16} />
                Back to dashboard
              </button>
              <h1 className="text-3xl font-bold text-white">Customers</h1>
              <p className="text-sm text-white/90 font-medium mt-1">
                {merchant.name} · {total} total · {optedIn} opted in
              </p>
            </div>
            <button
              onClick={handleExport}
              className="bg-white/25 hover:bg-white/40 backdrop-blur text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 mb-6">
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  filter === f.value
                    ? "text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                style={{
                  background:
                    filter === f.value ? merchant.primaryColor : undefined,
                  boxShadow:
                    filter === f.value
                      ? `0 4px 12px ${merchant.primaryColor}40`
                      : undefined,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-16 text-center border border-slate-200">
            <Users className="mx-auto text-slate-300 mb-4" size={56} />
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              No customers yet
            </h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
              {search || filter !== "all"
                ? "No customers match your filters. Try changing them."
                : "Once customers start earning stamps, they'll appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {customers.map((c) => (
                <motion.div
                  key={c.cardId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setOpenCustomerId(c.customerId)}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200 cursor-pointer hover:border-slate-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md"
                        style={{ background: merchant.primaryColor }}
                      >
                        {(c.name || c.phoneNumber).slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900 truncate">
                            {c.name || "Unknown"}
                          </h3>
                          {c.marketingConsent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={10} />
                              Opted In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              <XCircle size={10} />
                              No Opt-in
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1 font-medium">
                          <Phone size={13} />
                          <span className="font-mono">{c.phoneNumber}</span>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-3 text-xs">
                          <span className="flex items-center gap-1 text-slate-600 font-semibold">
                            <Users size={12} />
                            {c.totalVisits} visits
                          </span>
                          <span className="flex items-center gap-1 text-slate-600 font-semibold">
                            <Gift size={12} />
                            {c.totalRedemptions} redeemed
                          </span>
                          <span
                            className="flex items-center gap-1 font-bold"
                            style={{ color: merchant.primaryColor }}
                          >
                            <User size={12} />
                            {c.stampCount}/{merchant.stampsRequired} stamps now
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <Clock size={12} />
                            Last:{" "}
                            {new Date(c.lastVisit).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {openCustomerId && (
        <CustomerHistoryDrawer
          merchantId={merchant.id}
          customerId={openCustomerId}
          color={merchant.primaryColor}
          onClose={() => setOpenCustomerId(null)}
        />
      )}
    </div>
  );
}