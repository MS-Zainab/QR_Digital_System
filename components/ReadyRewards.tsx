"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  CheckCircle2,
  Loader2,
  Phone,
  User,
  Sparkles,
} from "lucide-react";

interface ReadyReward {
  cardId: string;
  customerId: string;
  name: string | null;
  phoneNumber: string;
  stampCount: number;
  readySince: string;
}

export default function ReadyRewards({
  merchantId,
  color,
  rewardDescription,
  stampsRequired,
  onRedeemed,
}: {
  merchantId: string;
  color: string;
  rewardDescription: string;
  stampsRequired: number;
  onRedeemed?: () => void;
}) {
  const [rewards, setRewards] = useState<ReadyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [lastRedeemed, setLastRedeemed] = useState<ReadyReward | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/merchant/${merchantId}/ready-rewards`);
      if (!res.ok) return;
      const data = await res.json();
      setRewards(data.ready || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    let interval: any = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(load, 10000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        load();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId]);

  const handleRedeem = async (item: ReadyReward) => {
    setError(null);

    if (
      !window.confirm(
        `Redeem "${rewardDescription}" for ${item.name || item.phoneNumber}?`
      )
    )
      return;

    setActingOn(item.cardId);
    try {
      console.log("[Redeem] Calling API for", item.customerId);
      const res = await fetch(`/api/merchant/${merchantId}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: item.customerId }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("[Redeem] Response:", res.status, data);

      if (!res.ok) {
        setError(data.error || `Failed (${res.status})`);
        setActingOn(null);
        return;
      }

      setLastRedeemed(item);
      setRewards((r) => r.filter((x) => x.cardId !== item.cardId));
      if (onRedeemed) onRedeemed();
      setTimeout(() => setLastRedeemed(null), 3000);
      setTimeout(load, 500);
    } catch (e: any) {
      console.error("[Redeem] Network error:", e);
      setError("Network error");
    }
    setActingOn(null);
  };

  if (loading) return null;
  if (rewards.length === 0 && !lastRedeemed && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-sm p-6 mt-6 border-2 border-amber-300 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 animate-pulse" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Gift className="text-amber-600" size={22} />
            {rewards.length > 0 && (
              <>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full" />
              </>
            )}
          </div>
          <h2 className="font-bold text-lg text-slate-900">
            Rewards to Redeem
          </h2>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
          {rewards.length}
        </span>
      </div>

      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-3 mb-4 text-sm text-rose-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      <AnimatePresence>
        {lastRedeemed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-3"
          >
            <CheckCircle2 className="text-emerald-600 shrink-0" size={22} />
            <div>
              <p className="font-bold text-emerald-900 text-sm">
                ✅ Redeemed successfully!
              </p>
              <p className="text-xs text-emerald-700 font-medium">
                {lastRedeemed.name || lastRedeemed.phoneNumber} · Card reset to
                0/{stampsRequired}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {rewards.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {rewards.map((item) => (
              <motion.div
                key={item.cardId}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50, height: 0 }}
                className="border-2 border-amber-200 rounded-2xl p-4 bg-amber-50/40"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <User size={16} className="shrink-0 text-slate-500" />
                      <span className="truncate">
                        {item.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1 font-medium">
                      <Phone size={13} className="shrink-0" />
                      <span className="truncate">{item.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs font-bold text-amber-700">
                      <Sparkles size={12} />
                      {item.stampCount} / {stampsRequired} stamps — Complete!
                    </div>
                  </div>
                  <div className="bg-amber-200 text-amber-900 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                    {item.stampCount}/{stampsRequired}
                  </div>
                </div>

                <button
                  onClick={() => handleRedeem(item)}
                  disabled={actingOn === item.cardId}
                  className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-md"
                >
                  {actingOn === item.cardId ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Redeem: {rewardDescription}
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}