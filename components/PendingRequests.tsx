"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Bell,
  Clock,
  User,
  Phone,
} from "lucide-react";

interface RequestItem {
  id: string;
  createdAt: string;
  expiresAt: string;
  customer: {
    id: string;
    name: string | null;
    phoneNumber: string;
  };
  currentStamps: number;
}

export default function PendingRequests({
  merchantId,
  color,
  stampsRequired,
}: {
  merchantId: string;
  color: string;
  stampsRequired: number;
}) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(
        `/api/stamp-requests?merchantId=${merchantId}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setRequests(data.requests || []);
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

  const handleApprove = async (id: string) => {
    setActingOn(id);
    try {
      await fetch(`/api/stamp-requests/${id}/approve`, { method: "POST" });
      setRequests((r) => r.filter((x) => x.id !== id));
      setTimeout(load, 300);
    } catch {}
    setActingOn(null);
  };

  const handleDeny = async (id: string) => {
    setActingOn(id);
    try {
      await fetch(`/api/stamp-requests/${id}/deny`, { method: "POST" });
      setRequests((r) => r.filter((x) => x.id !== id));
      setTimeout(load, 300);
    } catch {}
    setActingOn(null);
  };

  if (loading && requests.length === 0) return null;
  if (requests.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 mt-6 border-2 border-amber-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 animate-pulse" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="text-amber-600 animate-pulse" size={22} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full" />
          </div>
          <h2 className="font-bold text-lg text-slate-900">
            Live Requests
          </h2>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: `${color}20`, color }}
        >
          {requests.length} pending
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              className="border-2 border-amber-100 rounded-2xl p-4 bg-amber-50/40"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <User size={14} className="shrink-0 text-slate-500" />
                    <span className="truncate">
                      {req.customer.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-medium">
                    <Phone size={12} className="shrink-0" />
                    <span className="truncate">
                      {req.customer.phoneNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 font-medium">
                    Current: {req.currentStamps} / {stampsRequired} stamps
                  </div>
                </div>
                <CountdownTimer expiresAt={req.expiresAt} />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={actingOn === req.id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-md"
                >
                  {actingOn === req.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleDeny(req.id)}
                  disabled={actingOn === req.id}
                  className="bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  <XCircle size={14} />
                  Deny
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setSeconds(left);
    };
    tick();
    const i = setInterval(tick, 500);
    return () => clearInterval(i);
  }, [expiresAt]);

  const urgent = seconds <= 15;

  return (
    <div
      className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg whitespace-nowrap ${
        urgent
          ? "bg-rose-100 text-rose-700 font-bold"
          : "bg-white border border-slate-200 text-slate-600"
      }`}
    >
      <Clock size={11} />
      {seconds}s
    </div>
  );
}