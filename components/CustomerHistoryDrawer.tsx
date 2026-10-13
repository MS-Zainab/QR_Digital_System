"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Calendar,
  Gift,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

interface HistoryData {
  customer: {
    id: string;
    name: string | null;
    phoneNumber: string;
    joinedAt: string;
  };
  card: {
    stampCount: number;
    isRedeemed: boolean;
    updatedAt: string;
  } | null;
  visits: { id: string; scannedAt: string }[];
  redemptions: {
    id: string;
    rewardText: string;
    redeemedAt: string;
    notes: string | null;
  }[];
  consent: { consented: boolean; consentedAt: string | null };
  stampsRequired: number;
  rewardDescription: string;
}

export default function CustomerHistoryDrawer({
  merchantId,
  customerId,
  color,
  onClose,
}: {
  merchantId: string;
  customerId: string;
  color: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/merchant/${merchantId}/customers/${customerId}`
        );
        if (!res.ok) {
          setError("Failed to load history");
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
  }, [merchantId, customerId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-50"
        />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
        >
          <div
            className="px-6 py-5 flex items-start justify-between"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center text-white font-bold text-base shrink-0">
                {data?.customer.name
                  ? data.customer.name.slice(0, 2).toUpperCase()
                  : data?.customer.phoneNumber.slice(-2) || "?"}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">
                  {data?.customer.name || "Customer"}
                </h2>
                <p className="text-xs text-white/90 font-medium font-mono">
                  {data?.customer.phoneNumber || "..."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition shrink-0"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin" size={28} style={{ color }} />
              </div>
            ) : error || !data ? (
              <div className="p-6 text-center text-rose-600 font-semibold">
                {error || "Failed to load"}
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Current card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Current Card
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold" style={{ color }}>
                        {data.card?.stampCount ?? 0} / {data.stampsRequired}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        stamps collected
                      </p>
                    </div>
                    {data.card &&
                      data.card.stampCount >= data.stampsRequired && (
                        <div className="bg-amber-100 border-2 border-amber-300 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                          <Gift size={12} />
                          Reward ready
                        </div>
                      )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Sparkles size={12} style={{ color }} />
                    {data.rewardDescription}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border-2 border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-semibold">
                      Total Visits
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {data.visits.length}
                    </p>
                  </div>
                  <div className="bg-white border-2 border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-semibold">
                      Rewards Redeemed
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {data.redemptions.length}
                    </p>
                  </div>
                </div>

                {/* Consent */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Marketing Consent
                  </p>
                  {data.consent.consented ? (
                    <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold">
                      <CheckCircle2 size={16} />
                      Opted in
                      {data.consent.consentedAt && (
                        <span className="text-xs text-slate-500 font-medium">
                          ·{" "}
                          {new Date(
                            data.consent.consentedAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                      <X size={16} />
                      Not opted in
                    </div>
                  )}
                </div>

                {/* Redemptions */}
                {data.redemptions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                      <Gift size={14} style={{ color }} />
                      Rewards Redeemed
                    </h3>
                    <div className="space-y-2">
                      {data.redemptions.map((r) => (
                        <div
                          key={r.id}
                          className="bg-amber-50 border border-amber-200 rounded-xl p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-amber-900 truncate">
                                {r.rewardText}
                              </p>
                              <p className="text-xs text-amber-700 font-medium mt-0.5">
                                {new Date(r.redeemedAt).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <CheckCircle2
                              className="text-amber-600 shrink-0"
                              size={16}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visit History */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                    <Clock size={14} style={{ color }} />
                    Visit History ({data.visits.length})
                  </h3>
                  {data.visits.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-xl font-medium">
                      No visits yet
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {data.visits.map((v, idx) => (
                        <div
                          key={v.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white border border-slate-100"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: color }}
                          >
                            +1
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-slate-900">
                              Stamp earned
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                              {new Date(v.scannedAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                            #{data.visits.length - idx}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Joined date */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Calendar size={12} />
                  Customer since{" "}
                  {new Date(data.customer.joinedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}