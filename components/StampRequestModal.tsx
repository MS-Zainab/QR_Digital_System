"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { getCachedVisit, saveCachedVisit } from "@/lib/stampCache";
import { normalizePkPhone, extractPkDigits } from "@/lib/phoneValidation";

type Stage = "form" | "waiting" | "approved" | "denied" | "expired" | "error";

interface Merchant {
  id: string;
  name: string;
  primaryColor: string;
  stampsRequired: number;
  rewardDescription: string;
}

export default function StampRequestModal({
  merchant,
  prefillPhone,
  onClose,
  onApproved,
}: {
  merchant: Merchant;
  prefillPhone?: string;
  onClose: () => void;
  onApproved: (data: { stampCount: number; rewardUnlocked: boolean }) => void;
}) {
  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [consent, setConsent] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [finalStampCount, setFinalStampCount] = useState(0);
  const [rewardUnlocked, setRewardUnlocked] = useState(false);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    const cached = getCachedVisit(merchant.id);
    if (cached) {
      setName(cached.name);
      setPhoneDigits(extractPkDigits(cached.phone));
      setIsCached(true);
    } else if (prefillPhone) {
      setPhoneDigits(extractPkDigits(prefillPhone));
    }
  }, [merchant.id, prefillPhone]);

  useEffect(() => {
    if (stage !== "waiting" || !expiresAt) return;
    const interval = setInterval(() => {
      const left = Math.max(
        0,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(left);
      if (left === 0) {
        setStage("expired");
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [stage, expiresAt]);

  useEffect(() => {
    if (stage !== "waiting" || !requestId) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/stamp-requests/${requestId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "APPROVED") {
          setFinalStampCount(data.stampCount);
          setRewardUnlocked(data.stampCount >= data.stampsRequired);
          setStage("approved");
        } else if (data.status === "DENIED") {
          setStage("denied");
        } else if (data.status === "EXPIRED") {
          setStage("expired");
        }
      } catch {}
    }, 2000);
    return () => clearInterval(poll);
  }, [stage, requestId]);

  const submit = async () => {
    setErrorMessage(null);

    const normalizedPhone = normalizePkPhone(phoneDigits);
    if (!normalizedPhone) {
      setErrorMessage("Please enter all 9 digits");
      return;
    }

    try {
      const res = await fetch("/api/stamp-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: merchant.id,
          phoneNumber: normalizedPhone,
          name: name.trim(),
          marketingConsent: consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to send request");
        return;
      }
      saveCachedVisit(merchant.id, name.trim(), normalizedPhone);
      setIsCached(true);
      setRequestId(data.requestId);
      setExpiresAt(new Date(data.expiresAt));
      setSecondsLeft(90);
      setStage("waiting");
    } catch {
      setErrorMessage("Network error");
    }
  };

  const retry = useCallback(() => {
    setStage("form");
    setRequestId(null);
    setExpiresAt(null);
    setErrorMessage(null);
  }, []);

  const canSubmit = name.trim().length >= 1 && phoneDigits.length === 9;
  const color = merchant.primaryColor;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-indigo-200 rounded-full mx-auto sm:hidden" />

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {stage === "form" && "Get your stamp"}
              {stage === "waiting" && "Waiting for approval"}
              {stage === "approved" && "Stamp added!"}
              {stage === "denied" && "Request denied"}
              {stage === "expired" && "Request expired"}
            </h2>
            <p className="text-sm font-semibold mt-0.5" style={{ color }}>
              at {merchant.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {stage === "form" && (
          <>
            {isCached && (
              <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-3 text-sm text-emerald-700 flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} />
                Welcome back! We remembered your details.
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: color }}
                />
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed Khan"
                autoComplete="name"
                className="w-full border-2 rounded-xl px-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-white focus:outline-none transition"
                style={{
                  borderColor: name ? color : "#c7d2fe",
                  boxShadow: name ? `0 0 0 4px ${color}20` : "none",
                }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: color }}
                />
                Phone Number
              </label>
              <div
                className="flex items-center gap-2 border-2 rounded-xl bg-white overflow-hidden transition"
                style={{
                  borderColor: phoneDigits ? color : "#c7d2fe",
                  boxShadow: phoneDigits ? `0 0 0 4px ${color}20` : "none",
                }}
              >
                <span className="pl-4 py-3.5 text-base font-bold text-slate-900 select-none">
                  03
                </span>
                <input
                  type="tel"
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(extractPkDigits(e.target.value))}
                  placeholder="001234567"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={9}
                  className="flex-1 pr-4 py-3.5 text-base font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {!isCached && (
              <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  I agree to receive offers, promotions and updates from{" "}
                  <strong className="text-slate-900">{merchant.name}</strong>.
                  You can opt out anytime.
                </span>
              </label>
            )}

            {errorMessage && (
              <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm p-3 rounded-xl flex items-start gap-2 font-medium">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit}
              className="w-full text-white py-4 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition shadow-lg"
              style={{
                background: color,
                boxShadow: canSubmit ? `0 8px 20px -8px ${color}` : "none",
              }}
            >
              <Sparkles size={18} />
              Request Stamp
            </button>

            <p className="text-xs text-slate-500 text-center font-medium">
              The store will approve your request on their screen
            </p>
          </>
        )}

        {stage === "waiting" && (
          <div className="text-center py-6 space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse"
                style={{ background: `${color}20` }}
              >
                <Clock size={40} style={{ color }} />
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">
                Waiting for merchant...
              </p>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Show your screen to the cashier
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-slate-400" />
              <span className="text-sm text-slate-500 font-medium">
                {secondsLeft} seconds left
              </span>
            </div>
          </div>
        )}

        {stage === "approved" && (
          <div className="text-center py-6 space-y-5">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full"
              style={{ background: `${color}20` }}
            >
              <CheckCircle2 size={48} style={{ color }} strokeWidth={2.5} />
            </motion.div>
            <div>
              <p className="font-bold text-2xl text-slate-900">
                {finalStampCount} / {merchant.stampsRequired}
              </p>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                stamps collected
              </p>
            </div>
            {rewardUnlocked && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center gap-3"
              >
                <Sparkles className="text-amber-600 shrink-0" size={20} />
                <div className="text-left">
                  <p className="font-bold text-amber-800 text-sm">
                    🎉 Reward unlocked!
                  </p>
                  <p className="text-xs text-amber-700 font-medium">
                    {merchant.rewardDescription}
                  </p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => {
                onApproved({ stampCount: finalStampCount, rewardUnlocked });
                onClose();
              }}
              className="w-full text-white py-4 rounded-xl font-bold transition shadow-lg"
              style={{ background: color, boxShadow: `0 8px 20px -8px ${color}` }}
            >
              Done
            </button>
          </div>
        )}

        {stage === "denied" && (
          <div className="text-center py-6 space-y-5">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-rose-50">
              <XCircle size={48} className="text-rose-500" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">
                Request was denied
              </p>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Please ask the cashier for help
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={retry}
                className="flex-1 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="flex-1 text-white py-3.5 rounded-xl font-bold transition"
                style={{ background: color }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {stage === "expired" && (
          <div className="text-center py-6 space-y-5">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-50">
              <Clock size={48} className="text-amber-500" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">
                Request timed out
              </p>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                The cashier didn&apos;t respond in time
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={retry}
                className="flex-1 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="flex-1 text-white py-3.5 rounded-xl font-bold transition"
                style={{ background: color }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}