"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import Footer from "@/components/Footer";
import {
  BarChart3,
  Users,
  Gift,
  QrCode,
  Loader2,
  Download,
  TrendingUp,
  Store,
  Clock,
  LogOut,
  Settings as SettingsIcon,
  BarChart,
  FileText,
  CreditCard,
  Search,
  Phone,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Save,
  Palette,
  Link as LinkIcon,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COLOR_CATEGORIES, isValidHex, normalizeHex } from "@/lib/colorPalette";
import PendingRequests from "@/components/PendingRequests";
import ReadyRewards from "@/components/ReadyRewards";
import NotificationBell from "@/components/NotificationBell";
import TrialBanner from "@/components/TrialBanner";
import MerchantAnalyticsTab from "@/components/MerchantAnalyticsTab";
import MerchantReportsTab from "@/components/MerchantReportsTab";
import MerchantSubscriptionTab from "@/components/MerchantSubscriptionTab";
import CustomerHistoryDrawer from "@/components/CustomerHistoryDrawer";
import SendPromotionModal from "@/components/SendPromotionModal";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

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
  trialEndsAt: string;
  currentPeriodEndsAt?: string | null;
  subscriptionStatus: string;
  slug?: string | null;
  customPricePerMonth?: number | null;
}

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

type Tab =
  | "overview"
  | "analytics"
  | "customers"
  | "reports"
  | "subscription"
  | "settings";

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

export default function MerchantDashboardPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const reloadAnalytics = async () => {
    if (!merchant) return;
    try {
      const a = await fetch(`/api/merchant/${merchant.id}/analytics`).then(
        (r) => r.json()
      );
      setAnalytics(a);
    } catch {}
  };

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
        setError("Merchant not found");
        setLoading(false);
        return;
      }
      const m = await res.json();

      if (m.subscriptionStatus === "PENDING_APPROVAL") {
        router.push("/merchant/pending");
        return;
      }

      const checkRes = await fetch(`/api/merchant/${m.id}/subscription`);
      if (checkRes.ok) {
        const sub = await checkRes.json();
        if (!sub.allowed) {
          router.push("/merchant/expired");
          return;
        }
      }

      setMerchant(m);

      const a = await fetch(`/api/merchant/${m.id}/analytics`).then((r) =>
        r.json()
      );
      setAnalytics(a);
      setLoading(false);
    }

    load();
  }, [router]);

  // Periodic subscription re-check
  useEffect(() => {
    if (!merchant) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/merchant/${merchant.id}/subscription`);
        if (res.ok) {
          const sub = await res.json();
          if (!sub.allowed) {
            router.push("/merchant/expired");
          }
        }
      } catch {}
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [merchant, router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/merchant/login");
    router.refresh();
  };

  const handleMerchantUpdate = (updated: Partial<Merchant>) => {
    if (merchant) setMerchant({ ...merchant, ...updated });
  };

  useEffect(() => {
    if (merchant) document.title = `${merchant.name} · Dashboard`;
  }, [merchant]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
          <p className="text-sm text-slate-500 font-medium mt-3">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !merchant || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center">
          <p className="text-rose-600 font-semibold">
            {error || "Error loading dashboard"}
          </p>
          <button
            onClick={handleLogout}
            className="mt-4 text-indigo-600 font-semibold"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const qrValue = merchant.slug
    ? `${baseUrl}/${merchant.slug}`
    : `${baseUrl}/?m=${merchant.id}`;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart size={16} /> },
    { id: "customers", label: "Customers", icon: <Users size={16} /> },
    { id: "reports", label: "Reports", icon: <FileText size={16} /> },
    {
      id: "subscription",
      label: "Subscription",
      icon: <CreditCard size={16} />,
    },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${merchant.primaryColor}, ${merchant.primaryColor}dd)`,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Store size={14} className="text-white" />
                <p className="text-xs uppercase tracking-wider text-white font-bold">
                  Merchant Dashboard
                </p>
              </div>
              <h1 className="text-3xl font-bold text-white mt-1">
                {merchant.name}
              </h1>
              <div className="flex items-center gap-2 mt-3 text-sm text-white font-semibold">
                <Gift size={16} />
                <span>{merchant.rewardDescription}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <NotificationBell
                merchantId={merchant.id}
                color={merchant.primaryColor}
              />
              <button
                onClick={handleLogout}
                className="bg-white/25 backdrop-blur p-2.5 rounded-xl hover:bg-white/40 transition text-white border border-white/20"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-3 font-bold text-sm whitespace-nowrap rounded-t-xl transition relative ${
                    isActive
                      ? "bg-slate-50"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  style={{
                    color: isActive ? merchant.primaryColor : undefined,
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="mb-6">
            <TrialBanner
              status={merchant.subscriptionStatus}
              trialEndsAt={merchant.trialEndsAt}
              currentPeriodEndsAt={merchant.currentPeriodEndsAt}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <OverviewTab
                merchant={merchant}
                analytics={analytics}
                qrValue={qrValue}
                onRedeemed={reloadAnalytics}
              />
            )}

            {activeTab === "analytics" && (
              <MerchantAnalyticsTab
                merchantId={merchant.id}
                color={merchant.primaryColor}
              />
            )}

            {activeTab === "customers" && (
              <CustomersTab
                merchantId={merchant.id}
                merchantName={merchant.name}
                stampsRequired={merchant.stampsRequired}
                color={merchant.primaryColor}
              />
            )}

            {activeTab === "reports" && (
              <MerchantReportsTab
                merchantId={merchant.id}
                color={merchant.primaryColor}
              />
            )}

            {activeTab === "subscription" && (
              <MerchantSubscriptionTab
                merchant={{
                  id: merchant.id,
                  name: merchant.name,
                  subscriptionStatus: merchant.subscriptionStatus,
                  trialEndsAt: merchant.trialEndsAt,
                  currentPeriodEndsAt: merchant.currentPeriodEndsAt,
                  customPricePerMonth: merchant.customPricePerMonth,
                }}
                color={merchant.primaryColor}
              />
            )}

            {activeTab === "settings" && (
              <SettingsTab
                merchant={merchant}
                onUpdate={handleMerchantUpdate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <Footer variant="light" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Overview Tab
   ───────────────────────────────────────────── */

function OverviewTab({
  merchant,
  analytics,
  qrValue,
  onRedeemed,
}: {
  merchant: Merchant;
  analytics: Analytics;
  qrValue: string;
  onRedeemed: () => void;
}) {
  return (
    <div className="space-y-6">
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
          delay={0.05}
        />
        <StatCard
          icon={<Gift size={22} />}
          label="Rewards Redeemed"
          value={analytics.rewardsRedeemed}
          color={merchant.primaryColor}
          delay={0.1}
        />
      </div>

      <PendingRequests
        merchantId={merchant.id}
        color={merchant.primaryColor}
        stampsRequired={merchant.stampsRequired}
      />

      <ReadyRewards
        merchantId={merchant.id}
        color={merchant.primaryColor}
        rewardDescription={merchant.rewardDescription}
        stampsRequired={merchant.stampsRequired}
        onRedeemed={onRedeemed}
      />

      <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={20} className="text-slate-900" />
          <h2 className="font-bold text-lg text-slate-900">
            Your Store QR Code
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-white p-4 border-2 border-slate-200 rounded-2xl shrink-0">
            <QRCodeSVG value={qrValue} size={180} level="H" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-base text-slate-800 font-medium mb-3">
              Print this and place at your counter. Customers scan to earn
              stamps.
            </p>
            <p className="text-xs text-slate-600 break-all mb-4 font-mono bg-slate-100 border border-slate-200 p-3 rounded-lg">
              {qrValue}
            </p>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold shadow-md"
              style={{
                background: merchant.primaryColor,
                boxShadow: `0 4px 12px ${merchant.primaryColor}40`,
              }}
            >
              <Download size={16} />
              Print Table Tent
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} style={{ color: merchant.primaryColor }} />
          <h2 className="font-bold text-lg text-slate-900">
            Recent Activity
          </h2>
          <span className="text-xs text-slate-500 font-semibold ml-auto">
            Last 24 hours
          </span>
        </div>

        {analytics.recentScans.length === 0 ? (
          <div className="py-10 text-center">
            <Clock className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm text-slate-600 font-medium">
              No scans in the last 24 hours
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {analytics.recentScans.map((s) => (
              <div
                key={s.id}
                className="flex justify-between items-center py-3 px-3 rounded-xl hover:bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                    style={{ background: merchant.primaryColor }}
                  >
                    {(s.name || s.phone).slice(-2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {s.name || s.phone}
                    </p>
                    {s.name && (
                      <p className="text-xs text-slate-500 truncate font-medium">
                        {s.phone}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-2">
                  {new Date(s.scannedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Customers Tab
   ───────────────────────────────────────────── */

function CustomersTab({
  merchantId,
  merchantName,
  stampsRequired,
  color,
}: {
  merchantId: string;
  merchantName: string;
  stampsRequired: number;
  color: string;
}) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "opted-in" | "recent" | "inactive"
  >("all");
  const [total, setTotal] = useState(0);
  const [optedIn, setOptedIn] = useState(0);
  const [openCustomerId, setOpenCustomerId] = useState<string | null>(null);
  const [showPromotion, setShowPromotion] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (filter !== "all") params.set("filter", filter);

        const res = await fetch(
          `/api/merchant/${merchantId}/customers?${params.toString()}`
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
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [merchantId, search, filter]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    params.set("format", "csv");
    window.location.href = `/api/merchant/${merchantId}/customers?${params.toString()}`;
  };

  const filters = [
    { value: "all" as const, label: "All" },
    { value: "opted-in" as const, label: "Opted In" },
    { value: "recent" as const, label: "Recent (7d)" },
    { value: "inactive" as const, label: "Inactive (30d)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customers</h2>
          <p className="text-sm text-slate-500 font-medium">
            {total} total · {optedIn} opted in
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowPromotion(true)}
            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition"
            style={{ background: color }}
          >
            <Sparkles size={16} />
            Send Promotion
          </button>
          <button
            onClick={handleExport}
            className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
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
                background: filter === f.value ? color : undefined,
                boxShadow:
                  filter === f.value ? `0 4px 12px ${color}40` : undefined,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={28} style={{ color }} />
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
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md"
                    style={{ background: color }}
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
                        style={{ color }}
                      >
                        <UserIcon size={12} />
                        {c.stampCount} stamps now
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {openCustomerId && (
        <CustomerHistoryDrawer
          merchantId={merchantId}
          customerId={openCustomerId}
          color={color}
          onClose={() => setOpenCustomerId(null)}
        />
      )}

      {showPromotion && (
        <SendPromotionModal
          merchantId={merchantId}
          merchantName={merchantName}
          stampsRequired={stampsRequired}
          color={color}
          onClose={() => setShowPromotion(false)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Settings Tab
   ───────────────────────────────────────────── */

function SettingsTab({
  merchant,
  onUpdate,
}: {
  merchant: Merchant;
  onUpdate: (m: Partial<Merchant>) => void;
}) {
  const [name, setName] = useState(merchant.name);
  const [businessType, setBusinessType] = useState(merchant.businessType);
  const [rewardDescription, setRewardDescription] = useState(
    merchant.rewardDescription
  );
  const [stampsRequired, setStampsRequired] = useState(merchant.stampsRequired);
  const [primaryColor, setPrimaryColor] = useState(merchant.primaryColor);
  const [customColor, setCustomColor] = useState("");
  const [slug, setSlug] = useState(merchant.slug || "");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const BUSINESS_TYPES = [
    { value: "cafe", label: "Cafe" },
    { value: "restaurant", label: "Restaurant" },
    { value: "salon", label: "Salon" },
    { value: "retail", label: "Retail" },
  ];

  useEffect(() => {
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) {
      setSlugStatus("idle");
      return;
    }
    if (cleanSlug.length < 3 || !/^[a-z0-9-]+$/.test(cleanSlug)) {
      setSlugStatus("invalid");
      return;
    }
    if (cleanSlug === merchant.slug) {
      setSlugStatus("available");
      return;
    }

    let cancelled = false;
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/merchant/slug/${cleanSlug}`);
        if (cancelled) return;
        if (res.status === 404) setSlugStatus("available");
        else if (res.ok) setSlugStatus("taken");
        else setSlugStatus("available");
      } catch {
        if (!cancelled) setSlugStatus("available");
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug, merchant.slug]);

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Business name too short");
      return;
    }
    if (!rewardDescription.trim() || rewardDescription.trim().length < 3) {
      setErrorMsg("Reward description too short");
      return;
    }
    if (stampsRequired < 3 || stampsRequired > 20) {
      setErrorMsg("Stamps must be between 3 and 20");
      return;
    }
    if (!isValidHex(primaryColor)) {
      setErrorMsg("Invalid color");
      return;
    }
    if (slug && slugStatus === "taken") {
      setErrorMsg("URL already taken");
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        name: name.trim(),
        businessType,
        rewardDescription: rewardDescription.trim(),
        stampsRequired,
        primaryColor,
      };
      if (slug && slug !== merchant.slug) updates.slug = slug.toLowerCase();

      const res = await fetch(`/api/merchant/${merchant.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      onUpdate(data.merchant);
      setSuccessMsg("Settings saved!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setErrorMsg("Network error");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          <CheckCircle2 size={18} />
          {successMsg}
        </motion.div>
      )}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border-2 border-rose-200 text-rose-800 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          <XCircle size={18} />
          {errorMsg}
        </motion.div>
      )}

      <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${primaryColor}20` }}
          >
            <Store size={18} style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-lg text-slate-900">Business Info</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Business Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  onClick={() => setBusinessType(bt.value)}
                  className={`py-3 rounded-xl border-2 font-semibold text-sm transition ${
                    businessType === bt.value
                      ? "text-white shadow-md"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                  style={{
                    borderColor:
                      businessType === bt.value ? primaryColor : undefined,
                    background:
                      businessType === bt.value ? primaryColor : undefined,
                  }}
                >
                  {bt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${primaryColor}20` }}
          >
            <Gift size={18} style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-lg text-slate-900">
            Loyalty Program
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Reward Description
            </label>
            <input
              type="text"
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              maxLength={200}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Stamps Required:{" "}
              <span className="text-base" style={{ color: primaryColor }}>
                {stampsRequired}
              </span>
            </label>
            <input
              type="range"
              min={3}
              max={20}
              value={stampsRequired}
              onChange={(e) => setStampsRequired(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: primaryColor }}
            />
            <div className="flex justify-between text-xs text-slate-500 font-semibold mt-1">
              <span>3 (quick)</span>
              <span>20 (long)</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${primaryColor}20` }}
          >
            <Palette size={18} style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-lg text-slate-900">Brand Color</h2>
        </div>

        {COLOR_CATEGORIES.map((cat) => (
          <div key={cat.label} className="mb-6 last:mb-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {cat.label}
            </p>
            <div className="flex flex-wrap gap-3">
              {cat.colors.map((c) => {
                const isSelected = primaryColor === c.hex;
                return (
                  <button
                    key={c.hex}
                    onClick={() => setPrimaryColor(c.hex)}
                    title={c.name}
                    className="relative w-12 h-12 rounded-full transition-all cursor-pointer flex items-center justify-center hover:scale-110"
                    style={{
                      background: c.hex,
                      transform: isSelected ? "scale(1.15)" : "scale(1)",
                      boxShadow: isSelected
                        ? `0 0 0 3px white, 0 0 0 5px ${c.hex}`
                        : "0 2px 6px rgba(0,0,0,0.15)",
                    }}
                  >
                    {isSelected && (
                      <CheckCircle2 size={20} className="text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-6 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-800 mb-2">
            Custom Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-14 h-14 rounded-xl cursor-pointer border-2 border-slate-200"
            />
            <input
              type="text"
              value={customColor || primaryColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                const n = normalizeHex(e.target.value);
                if (n) setPrimaryColor(n);
              }}
              placeholder="#4f46e5"
              maxLength={7}
              className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
            />
            <div
              className="w-12 h-12 rounded-xl shrink-0 border-2 border-slate-200"
              style={{ background: primaryColor }}
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${primaryColor}20` }}
          >
            <LinkIcon size={18} style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-lg text-slate-900">Store URL</h2>
        </div>

        <div className="flex items-center gap-2 border-2 border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-indigo-500 transition">
          <span className="pl-4 py-3 text-sm font-medium text-slate-500 whitespace-nowrap select-none">
            {typeof window !== "undefined" ? window.location.origin : ""}/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="your-store-name"
            maxLength={40}
            className="flex-1 pr-4 py-3 text-base font-bold text-slate-900 focus:outline-none"
          />
          <div className="pr-3">
            {slugStatus === "checking" && (
              <Loader2 className="animate-spin text-slate-400" size={18} />
            )}
            {slugStatus === "available" && (
              <CheckCircle2 className="text-emerald-600" size={18} />
            )}
            {slugStatus === "taken" && (
              <XCircle className="text-rose-600" size={18} />
            )}
            {slugStatus === "invalid" && (
              <AlertCircle className="text-amber-600" size={18} />
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium mt-2">
          {slugStatus === "available" && "✅ Available"}
          {slugStatus === "taken" && "❌ Already taken"}
          {slugStatus === "invalid" &&
            "⚠️ Use 3+ chars, lowercase letters, numbers, dashes"}
          {slugStatus === "idle" && "Your custom store URL"}
          {slugStatus === "checking" && "Checking..."}
        </p>
      </section>

      <div className="flex justify-end sticky bottom-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-white px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-2 disabled:opacity-50 transition shadow-lg"
          style={{
            background: primaryColor,
            boxShadow: `0 8px 20px -8px ${primaryColor}`,
          }}
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stat Card
   ───────────────────────────────────────────── */

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
      className="bg-white rounded-3xl shadow-sm p-5 border border-slate-200"
    >
      <div
        className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-3"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600 mt-1 font-semibold">{label}</p>
    </motion.div>
  );
}