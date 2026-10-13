"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  X,
  Loader2,
  Sparkles,
  Award,
  Store,
  ChevronRight,
  User,
  Phone,
  LogOut,
  AlertCircle,
  Gift,
} from "lucide-react";
import { useSession } from "@/lib/useSession";
import { normalizePkPhone, extractPkDigits } from "@/lib/phoneValidation";
import StampGrid from "@/components/StampGrid";
import RewardProgress from "@/components/RewardProgress";
import StampRequestModal from "@/components/StampRequestModal";
import type { CustomerCard, Merchant } from "@/lib/types";

const QRScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-white">
      <Loader2 className="animate-spin" />
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();
  const { phone, loaded, save, clear } = useSession();
  const [cards, setCards] = useState<CustomerCard[]>([]);
  const [activeMerchant, setActiveMerchant] = useState<Merchant | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePhoneModal, setShowChangePhoneModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loadCards = useCallback(async () => {
    if (!phone) return;
    try {
      const res = await fetch(`/api/cards?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      setCards(data.cards || []);
    } catch (e) {
      console.error("Failed to load cards", e);
    }
  }, [phone]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    document.title = "My Loyalty Cards · QR Digital Loyalty";
  }, []);

  useEffect(() => {
    if (!phone) return;
    const params = new URLSearchParams(window.location.search);
    const mid = params.get("m");
    if (!mid) return;
    if (!/^[0-9a-f-]{36}$/i.test(mid)) return;

    (async () => {
      try {
        const res = await fetch(`/api/merchant/${mid}`);
        if (res.ok) {
          const m = await res.json();
          setActiveMerchant(m);
        }
      } catch {}
    })();
  }, [phone]);

  const handleQRResult = useCallback(async (text: string) => {
    setShowScanner(false);
    setScanError(null);

    let merchantId: string | null = null;
    let slug: string | null = null;

    // Try to parse as URL
    try {
      const url = new URL(text);

      // Format 1: https://app.com/?m=<uuid>
      const m = url.searchParams.get("m");
      if (m) {
        merchantId = m;
      } else {
        // Format 2: https://app.com/<slug>
        // Extract the path (strip leading /)
        const path = url.pathname.replace(/^\/+|\/+$/g, "");
        // Only treat as slug if it's a single path segment
        if (path && !path.includes("/")) {
          slug = path;
        }
      }
    } catch {
      // Not a URL — check if it's a raw UUID or raw slug
      const trimmed = text.trim();
      if (/^[0-9a-f-]{36}$/i.test(trimmed)) {
        merchantId = trimmed;
      } else if (/^[a-z0-9-]+$/i.test(trimmed) && trimmed.length >= 3) {
        slug = trimmed.toLowerCase();
      }
    }

    // If we have a merchant ID → fetch by id
    if (merchantId && /^[0-9a-f-]{36}$/i.test(merchantId)) {
      try {
        const res = await fetch(`/api/merchant/${merchantId}`);
        if (!res.ok) {
          setScanError("Store not found");
          return;
        }
        const merchant = await res.json();
        setActiveMerchant(merchant);
      } catch {
        setScanError("Could not reach store");
      }
      return;
    }

    // If we have a slug → fetch by slug
    if (slug) {
      try {
        const res = await fetch(`/api/merchant/slug/${slug}`);
        if (!res.ok) {
          setScanError("Store not found");
          return;
        }
        const merchant = await res.json();
        // The slug API returns merchant info; but our StampRequestModal
        // expects `id` + `primaryColor` etc. Let's fetch full details by id.
        if (merchant.id) {
          const fullRes = await fetch(`/api/merchant/${merchant.id}`);
          if (fullRes.ok) {
            const fullMerchant = await fullRes.json();
            setActiveMerchant(fullMerchant);
          } else {
            setActiveMerchant(merchant);
          }
        } else {
          setActiveMerchant(merchant);
        }
      } catch {
        setScanError("Could not reach store");
      }
      return;
    }

    // Nothing worked
    setScanError("This QR doesn't look like a store code.");
  }, []);

  const handleChangePhone = (newPhone: string) => {
    clear();
    save(newPhone);
    setShowChangePhoneModal(false);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    clear();
    setCards([]);
    setShowLogoutConfirm(false);
    setShowProfileMenu(false);
  };

  const closeModal = () => {
    setActiveMerchant(null);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", "/");
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!phone) {
    return <PhoneEntry onSave={save} />;
  }

  return (
    <main className="min-h-screen pb-32 bg-gradient-to-b from-indigo-50/50 to-white">
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 500,
                  y: (Math.random() - 0.5) * 500,
                  scale: [0, 1, 0.5],
                  rotate: Math.random() * 720,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute"
              >
                <Sparkles size={24} className="text-yellow-400" fill="currentColor" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-indigo-100">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">My Cards</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{phone}</p>
            </div>
            <button
              onClick={() => setShowProfileMenu(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center active:scale-95 transition shadow-md shadow-indigo-200"
              aria-label="Open profile menu"
            >
              <Award className="text-white" size={20} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-40 mx-auto max-w-md"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-xl text-center text-sm font-semibold">
              {successMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        {cards.length === 0 ? (
          <EmptyState onScan={() => setShowScanner(true)} />
        ) : (
          cards.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <CardItem
                card={c}
                onClick={() => {
                  const slug = c.merchant?.slug || c.merchantId;
                  router.push(`/card/${slug}`);
                }}
              />
            </motion.div>
          ))
        )}
      </div>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setShowScanner(true);
          setScanError(null);
        }}
        className="fixed bottom-6 right-6 z-30 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full p-4 shadow-xl shadow-indigo-300"
      >
        <QrCode size={28} />
      </motion.button>

      {showScanner && (
        <div className="fixed inset-0 bg-black z-40 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-white font-semibold">Scan Store QR</h2>
            <button onClick={() => setShowScanner(false)} className="text-white p-2">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            <QRScanner onScan={handleQRResult} />
          </div>
          <p className="text-white text-center text-sm pb-8 px-6">
            Point your camera at the store&apos;s QR code
          </p>
        </div>
      )}

      <AnimatePresence>
        {scanError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-50 mx-auto max-w-md bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl text-center text-sm font-medium"
          >
            {scanError}
            <button onClick={() => setScanError(null)} className="ml-2 underline">
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {activeMerchant && (
        <StampRequestModal
          merchant={{
            id: activeMerchant.id,
            name: activeMerchant.name,
            primaryColor: activeMerchant.primaryColor,
            stampsRequired: activeMerchant.stampsRequired,
            rewardDescription: activeMerchant.rewardDescription,
          }}
          prefillPhone={phone ?? ""}
          onClose={closeModal}
          onApproved={(data) => {
            closeModal();
            if (data.rewardUnlocked) {
              setCelebrate(true);
              setTimeout(() => setCelebrate(false), 2500);
            }
            setSuccessMessage(
              data.rewardUnlocked ? `🎉 Reward unlocked!` : `+1 stamp added!`
            );
            loadCards();
            setTimeout(() => setSuccessMessage(null), 3500);
          }}
        />
      )}

      <ProfileMenu
        open={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        phone={phone}
        onChangePhone={() => {
          setShowProfileMenu(false);
          setShowChangePhoneModal(true);
        }}
        onLogout={() => {
          setShowProfileMenu(false);
          setShowLogoutConfirm(true);
        }}
      />

      <ChangePhoneModal
        open={showChangePhoneModal}
        currentPhone={phone}
        onClose={() => setShowChangePhoneModal(false)}
        onConfirm={handleChangePhone}
      />

      <LogoutConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </main>
  );
}

/* ─────────────────────────────────────────────── */

function ProfileMenu({
  open,
  onClose,
  phone,
  onChangePhone,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  phone: string;
  onChangePhone: () => void;
  onLogout: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-20 right-4 z-50 w-64 bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden"
          >
            <div className="px-4 py-4 border-b border-indigo-50 bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                  <User className="text-white" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide">
                    Signed in
                  </p>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={onChangePhone}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-indigo-50 active:bg-indigo-100 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <Phone className="text-indigo-600" size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Change Number</p>
                  <p className="text-xs text-slate-500 font-medium">
                    Switch to another account
                  </p>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-rose-50 active:bg-rose-100 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <LogOut className="text-rose-600" size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-600">Log Out</p>
                  <p className="text-xs text-slate-500 font-medium">Clear session</p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ChangePhoneModal({
  open,
  currentPhone,
  onClose,
  onConfirm,
}: {
  open: boolean;
  currentPhone: string;
  onClose: () => void;
  onConfirm: (newPhone: string) => void;
}) {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDigits("");
      setError(null);
    }
  }, [open]);

  const submit = () => {
    const normalized = normalizePkPhone(digits);
    if (!normalized) {
      setError("Please enter all 9 digits");
      return;
    }
    if (normalized === currentPhone) {
      setError("This is already your current number");
      return;
    }
    setError(null);
    onConfirm(normalized);
  };

  const isValid = digits.length === 9;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
          >
            <div className="w-12 h-1.5 bg-indigo-200 rounded-full mx-auto sm:hidden" />

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Phone className="text-indigo-600" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Change phone number
                </h2>
                <p className="text-sm text-slate-500 mt-0.5 font-medium">
                  Cards linked to your new number will appear instead.
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-slate-600">
              Current:{" "}
              <span className="font-mono font-bold text-indigo-700">
                {currentPhone}
              </span>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                New Phone Number
              </label>
              <div className="flex items-center gap-2 border-2 border-indigo-200 rounded-xl bg-white focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100 transition overflow-hidden">
                <span className="pl-4 py-3.5 text-base font-bold text-slate-900 select-none">
                  03
                </span>
                <input
                  type="tel"
                  value={digits}
                  onChange={(e) => {
                    const next = extractPkDigits(e.target.value);
                    setDigits(next);
                    if (error) setError(null);
                  }}
                  placeholder="001234567"
                  autoFocus
                  inputMode="numeric"
                  maxLength={9}
                  className="flex-1 pr-4 py-3.5 text-base font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
              {error && (
                <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} />
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!isValid}
                className="flex-1 py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition shadow-lg shadow-indigo-200"
              >
                Switch
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-3xl p-6 max-w-sm w-full space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
              <LogOut className="text-rose-600" size={26} />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-900">Log out?</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Your session will be cleared. You can log back in with your phone
                number anytime.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white active:scale-95 transition shadow-lg shadow-rose-200"
              >
                Log Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────── */

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20 px-6"
    >
      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6">
        <Store className="text-indigo-500" size={40} />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        Start earning rewards
      </h2>
      <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto font-medium">
        Scan a store&apos;s QR code to add your first loyalty card and start
        collecting stamps.
      </p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onScan}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200"
      >
        <QrCode size={18} />
        Scan a Store QR
      </motion.button>
    </motion.div>
  );
}

function CardItem({
  card,
  onClick,
}: {
  card: CustomerCard;
  onClick?: () => void;
}) {
  if (!card.merchant) return null;
  const { merchant } = card;
  const rewardReady = card.stampCount >= merchant.stampsRequired;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 cursor-pointer active:scale-[0.98] transition"
      style={{
        boxShadow: rewardReady
          ? `0 8px 32px -8px ${merchant.primaryColor}60`
          : `0 4px 24px -8px ${merchant.primaryColor}30`,
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between relative"
        style={{
          background: `linear-gradient(135deg, ${merchant.primaryColor}, ${merchant.primaryColor}dd)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Store className="text-white" size={20} />
          </div>
          <div>
            <h2 className="font-bold text-white text-base leading-tight">
              {merchant.name}
            </h2>
            <p className="text-white/80 text-xs capitalize font-medium">
              {merchant.businessType}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-2xl leading-none">
            {rewardReady ? "🎁" : card.stampCount}
          </div>
          <div className="text-white/80 text-[10px] uppercase tracking-wider font-semibold">
            {rewardReady ? "Reward ready" : `of ${merchant.stampsRequired}`}
          </div>
        </div>
      </div>

      {rewardReady && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-2xl p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-md">
            <Gift className="text-white" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-900 text-sm leading-tight">
              🎉 Reward Ready!
            </p>
            <p className="text-amber-800 text-xs font-medium mt-0.5 truncate">
              {merchant.rewardDescription}
            </p>
          </div>
          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider whitespace-nowrap">
            Show cashier
          </p>
        </motion.div>
      )}

      <RewardProgress
        count={card.stampCount}
        required={merchant.stampsRequired}
        color={merchant.primaryColor}
        rewardDescription={merchant.rewardDescription}
      />

      <StampGrid
        count={card.stampCount}
        required={merchant.stampsRequired}
        color={merchant.primaryColor}
        businessType={merchant.businessType}
      />
    </div>
  );
}

function PhoneEntry({ onSave }: { onSave: (p: string) => void }) {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const normalized = normalizePkPhone(digits);
    if (!normalized) {
      setError("Please enter all 9 digits");
      return;
    }
    setError(null);
    onSave(normalized);
  };

  const canSubmit = digits.length === 9;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-5 shadow-xl shadow-indigo-200"
          >
            <QrCode className="text-white" size={36} />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900">
            Loyalty, reimagined
          </h1>
          <p className="text-indigo-600 mt-2 text-sm font-medium">
            Your phone is your card. No apps to install.
          </p>
        </div>

        <div className="space-y-4 bg-white p-5 rounded-3xl shadow-lg shadow-indigo-100 border border-indigo-50">
          <div>
            <label className="flex items-center gap-2 text-base font-bold text-slate-800 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Enter your phone number
            </label>
            <div className="flex items-center gap-2 border-2 border-indigo-200 rounded-2xl bg-white focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100 transition overflow-hidden">
              <span className="pl-4 py-4 text-lg font-bold text-slate-900 select-none">
                03
              </span>
              <input
                type="tel"
                value={digits}
                onChange={(e) => {
                  const next = extractPkDigits(e.target.value);
                  setDigits(next);
                  if (error) setError(null);
                }}
                placeholder="001234567"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={9}
                className="flex-1 pr-4 py-4 text-lg font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            {error && (
              <p className="text-sm text-rose-600 mt-2 flex items-start gap-1 font-medium">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition"
          >
            Get Started
            <ChevronRight size={20} />
          </motion.button>
        </div>

        <p className="text-xs text-slate-500 text-center font-medium">
          We use your phone as your loyalty ID. No passwords, ever.
        </p>
      </motion.div>
    </main>
  );
}