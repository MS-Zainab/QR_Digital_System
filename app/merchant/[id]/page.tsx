"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart3,
  Users,
  Gift,
  QrCode,
  KeyRound,
  Loader2,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Store,
  Eye,
  EyeOff,
} from "lucide-react";

interface Analytics {
  merchantName: string;
  totalStamps: number;
  totalCustomers: number;
  rewardsRedeemed: number;
  recentScans: {
    id: string;
    phone: string;
    name: string | null;
    scannedAt: string;
  }[];
}

interface Merchant {
  id: string;
  name: string;
  businessType: string;
  primaryColor: string;
  stampsRequired: number;
  rewardDescription: string;
}

export default function MerchantDashboard() {
  const params = useParams();
  const merchantId = params.id as string;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!merchantId) return;
    Promise.all([
      fetch(`/api/merchant/${merchantId}`).then((r) => r.json()),
      fetch(`/api/merchant/${merchantId}/analytics`).then((r) => r.json()),
    ])
      .then(([m, a]) => {
        if (m.error) {
          setError(m.error);
        } else {
          setMerchant(m);
          setAnalytics(a);
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [merchantId]);

  // Update browser tab title
  useEffect(() => {
    if (merchant) {
      document.title = `${merchant.name} · Merchant Dashboard`;
    } else {
      document.title = "Merchant Dashboard · QR Digital Loyalty";
    }
  }, [merchant]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
          <p className="text-sm text-gray-500 mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !merchant || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
            <XCircle className="text-red-400" size={40} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Store not found
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            This merchant dashboard doesn&apos;t exist or the link is broken.
          </p>
        </motion.div>
      </div>
    );
  }

  const qrValue = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/?m=${merchant.id}`;

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Header with branded gradient */}
      <header
        className="text-white px-6 pt-10 pb-16 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${merchant.primaryColor}, ${merchant.primaryColor}dd)`,
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10"
          style={{ background: "white" }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
          style={{ background: "white" }}
        />

        <div className="max-w-4xl mx-auto relative">
          <div className="flex items-center gap-2 mb-1">
            <Store size={14} className="opacity-80" />
            <p className="text-xs uppercase tracking-wider opacity-80 font-medium">
              Merchant Dashboard
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1">
            {merchant.name}
          </h1>
          <div className="flex items-center gap-2 mt-3 text-sm opacity-90">
            <Gift size={16} />
            <span>{merchant.rewardDescription}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<BarChart3 size={22} />}
            label="Total Stamps"
            value={analytics.totalStamps}
            color={merchant.primaryColor}
            delay={0}
          />
          <StatCard
            icon={<Users size={22} />}
            label="Active Customers"
            value={analytics.totalCustomers}
            color={merchant.primaryColor}
            delay={0.1}
          />
          <StatCard
            icon={<Gift size={22} />}
            label="Rewards Redeemed"
            value={analytics.rewardsRedeemed}
            color={merchant.primaryColor}
            delay={0.2}
          />
        </div>

        {/* QR Code Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-sm p-6 mt-6 border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${merchant.primaryColor}15` }}
            >
              <QrCode size={18} style={{ color: merchant.primaryColor }} />
            </div>
            <h2 className="font-bold text-lg">Your Store QR Code</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5 ml-10">
            Print this and place at your counter. Customers scan to earn
            stamps.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 border-2 border-gray-100 rounded-2xl shadow-sm"
            >
              <QRCodeSVG
                value={qrValue}
                size={180}
                level="H"
                fgColor={merchant.primaryColor}
              />
            </motion.div>

            <div className="flex-1 text-center sm:text-left">
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">
                  QR Destination
                </p>
                <p className="text-xs text-gray-600 break-all font-mono">
                  {qrValue}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-md"
                style={{
                  background: merchant.primaryColor,
                  boxShadow: `0 4px 12px ${merchant.primaryColor}40`,
                }}
              >
                <Download size={16} />
                Print Table Tent
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* PIN Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PinManager merchantId={merchant.id} color={merchant.primaryColor} />
        </motion.div>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl shadow-sm p-6 mt-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${merchant.primaryColor}15` }}
              >
                <TrendingUp
                  size={18}
                  style={{ color: merchant.primaryColor }}
                />
              </div>
              <h2 className="font-bold text-lg">Recent Activity</h2>
            </div>
            {analytics.recentScans.length > 0 && (
              <span className="text-xs text-gray-400 font-medium">
                Last {analytics.recentScans.length}
              </span>
            )}
          </div>

          {analytics.recentScans.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Clock className="text-gray-300" size={28} />
              </div>
              <p className="text-sm text-gray-500 font-medium">
                No scans yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Share your QR code to get started
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {analytics.recentScans.map((s, idx) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex justify-between items-center py-3 px-2 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: merchant.primaryColor }}
                    >
                      {(s.name || s.phone).slice(-2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {s.name || s.phone}
                      </p>
                      {s.name && (
                        <p className="text-xs text-gray-400">{s.phone}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {formatRelative(s.scannedAt)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-3xl shadow-sm p-5 border border-gray-100"
    >
      <div
        className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-3"
        style={{ background: `${color}15`, color }}
      >
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900 tabular-nums">
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
    </motion.div>
  );
}

function PinManager({
  merchantId,
  color,
}: {
  merchantId: string;
  color: string;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPins, setShowPins] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const submit = async () => {
    setMessage("");

    if (newPin !== confirmPin) {
      setStatus("error");
      setMessage("New PINs do not match");
      return;
    }
    if (newPin.length !== 4) {
      setStatus("error");
      setMessage("New PIN must be exactly 4 digits");
      return;
    }
    if (newPin === currentPin) {
      setStatus("error");
      setMessage("New PIN must be different from current PIN");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`/api/merchant/${merchantId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to update PIN");
        return;
      }

      setStatus("success");
      setMessage("PIN updated successfully!");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 4000);
    } catch {
      setStatus("error");
      setMessage("Network error — please try again");
    }
  };

  const canSubmit =
    currentPin.length === 4 &&
    newPin.length === 4 &&
    confirmPin.length === 4 &&
    status !== "loading";

  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 mt-6 border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}15` }}
          >
            <KeyRound size={18} style={{ color }} />
          </div>
          <h2 className="font-bold text-lg">Staff PIN Manager</h2>
        </div>
        <button
          onClick={() => setShowPins(!showPins)}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition"
          aria-label={showPins ? "Hide PINs" : "Show PINs"}
        >
          {showPins ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-5 ml-10">
        The cashier enters this PIN on every scan to verify in-store activity.
      </p>

      <div className="space-y-3 max-w-sm">
        <PinInput
          label="Current PIN"
          value={currentPin}
          onChange={setCurrentPin}
          show={showPins}
          color={color}
        />
        <PinInput
          label="New PIN"
          value={newPin}
          onChange={setNewPin}
          show={showPins}
          color={color}
        />
        <PinInput
          label="Confirm New PIN"
          value={confirmPin}
          onChange={setConfirmPin}
          show={showPins}
          color={color}
        />

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-2xl text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
          style={{
            background: color,
            boxShadow: canSubmit ? `0 4px 12px ${color}40` : "none",
          }}
        >
          {status === "loading" && (
            <Loader2 size={16} className="animate-spin" />
          )}
          Update PIN
        </motion.button>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`flex items-center gap-2 text-sm p-3 rounded-xl font-medium ${
                status === "error"
                  ? "bg-red-50 text-red-700 border border-red-100"
                  : "bg-green-50 text-green-700 border border-green-100"
              }`}
            >
              {status === "error" ? (
                <XCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function PinInput({
  label,
  value,
  onChange,
  show,
  color,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  color: string;
}) {
  const filled = value.length === 4;
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">
        {label}
      </label>
      <input
        type={show ? "text" : "password"}
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder="••••"
        className="w-full border-2 rounded-xl p-3 tracking-[0.5em] text-center font-mono text-lg focus:outline-none transition"
        style={{
          borderColor: filled ? color : "#e5e7eb",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────── */

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}