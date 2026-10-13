"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface SuccessData {
  stampCount: number;
  stampsRequired: number;
  rewardUnlocked: boolean;
  rewardDescription: string;
  merchantName: string;
}

export default function VerificationModal({
  merchantId,
  merchantName,
  merchantColor,
  onClose,
  onSuccess,
  prefillPhone,
}: {
  merchantId: string;
  merchantName: string;
  merchantColor: string;
  onClose: () => void;
  onSuccess: (data: SuccessData) => void;
  prefillPhone?: string;
}) {
  const [phone, setPhone] = useState(prefillPhone ?? "");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          phoneNumber: phone,
          pin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong");
        return;
      }
      onSuccess(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = phone.length >= 7 && pin.length === 4 && !loading;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold" style={{ color: merchantColor }}>
              Add Stamp
            </h2>
            <p className="text-sm text-gray-500">at {merchantName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Your Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+923001234567"
            className="w-full border-2 rounded-xl p-3 mt-1 focus:outline-none focus:border-gray-400"
            style={{ borderColor: phone ? merchantColor : "#e5e7eb" }}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Staff PIN (ask the cashier)
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="w-full border-2 rounded-xl p-3 mt-1 tracking-[0.5em] text-center text-2xl font-mono focus:outline-none focus:border-gray-400"
            style={{ borderColor: pin.length === 4 ? merchantColor : "#e5e7eb" }}
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: merchantColor }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Verifying...
            </>
          ) : (
            "Add Stamp"
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          The cashier must enter the PIN to prevent fraud
        </p>
      </div>
    </div>
  );
}