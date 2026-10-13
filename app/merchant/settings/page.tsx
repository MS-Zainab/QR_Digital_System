"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  Palette,
  Store,
  Gift,
  Link as LinkIcon,
  AlertCircle,
  Sparkles,
  Building2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COLOR_CATEGORIES, isValidHex, normalizeHex } from "@/lib/colorPalette";

const BUSINESS_TYPES = [
  { value: "cafe", label: "Cafe" },
  { value: "restaurant", label: "Restaurant" },
  { value: "salon", label: "Salon" },
  { value: "retail", label: "Retail" },
];

interface Merchant {
  id: string;
  name: string;
  businessType: string;
  primaryColor: string;
  stampsRequired: number;
  rewardDescription: string;
  slug: string | null;
  subscriptionStatus: string;
}

export default function MerchantSettingsPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("cafe");
  const [rewardDescription, setRewardDescription] = useState("");
  const [stampsRequired, setStampsRequired] = useState(10);
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [customColor, setCustomColor] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  // Load merchant
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (!user) {
          router.push("/merchant/login");
          return;
        }

        const res = await fetch(
          `/api/merchant/by-email?email=${encodeURIComponent(user.email!)}`
        );

        if (cancelled) return;

        if (!res.ok) {
          router.push("/merchant/login");
          return;
        }

        const m: Merchant = await res.json();

        if (cancelled) return;

        setMerchant(m);
        setName(m.name);
        setBusinessType(m.businessType);
        setRewardDescription(m.rewardDescription);
        setStampsRequired(m.stampsRequired);
        setPrimaryColor(m.primaryColor);
        setSlug(m.slug || "");
        document.title = `Settings · ${m.name}`;
        setLoading(false);
      } catch (e) {
        console.error("Load error:", e);
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Slug availability check (debounced, safe)
  useEffect(() => {
    if (!merchant) return;

    const cleanSlug = slug.trim().toLowerCase();

    if (!cleanSlug) {
      setSlugStatus("idle");
      return;
    }
    if (cleanSlug.length < 3) {
      setSlugStatus("invalid");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setSlugStatus("invalid");
      return;
    }
    if (cleanSlug === merchant.slug) {
      setSlugStatus("available");
      return;
    }

    let cancelled = false;
    setSlugStatus("checking");

    const timer = setTimeout(async () => {
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
      clearTimeout(timer);
    };
  }, [slug, merchant]);

  const handleSave = async () => {
    if (!merchant) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Business name must be at least 2 characters");
      return;
    }
    if (!rewardDescription.trim() || rewardDescription.trim().length < 3) {
      setErrorMsg("Reward description must be at least 3 characters");
      return;
    }
    if (stampsRequired < 3 || stampsRequired > 20) {
      setErrorMsg("Stamps required must be between 3 and 20");
      return;
    }
    if (!isValidHex(primaryColor)) {
      setErrorMsg("Invalid color format");
      return;
    }
    if (slug && slugStatus === "taken") {
      setErrorMsg("The chosen URL is already taken");
      return;
    }
    if (slug && slugStatus === "invalid") {
      setErrorMsg(
        "URL slug must be at least 3 characters, letters/numbers/dashes only"
      );
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
      if (slug && slug !== merchant.slug) {
        updates.slug = slug.trim().toLowerCase();
      }

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

      setMerchant({ ...merchant, ...data.merchant });
      setSuccessMsg("Settings saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setErrorMsg("Network error");
    }
    setSaving(false);
  };

  const handleColorPick = (hex: string) => {
    setPrimaryColor(hex);
    setCustomColor("");
  };

  const handleCustomColor = (value: string) => {
    setCustomColor(value);
    const normalized = normalizeHex(value);
    if (normalized) setPrimaryColor(normalized);
  };

  if (loading || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const slugPreview = slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${slug}`
    : "(no slug set)";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push("/merchant/dashboard")}
            className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-semibold mb-3 transition"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/25 backdrop-blur rounded-2xl flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Store Settings</h1>
              <p className="text-sm text-white/90 font-medium mt-0.5">
                Customize your loyalty program and branding
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-rose-50 border-2 border-rose-200 text-rose-800 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
          >
            <XCircle size={18} />
            {errorMsg}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info */}
            <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${primaryColor}20` }}
                >
                  <Building2 size={18} style={{ color: primaryColor }} />
                </div>
                <h2 className="font-bold text-lg text-slate-900">
                  Business Info
                </h2>
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
                    placeholder="e.g. Cafe Bliss"
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
                            businessType === bt.value
                              ? primaryColor
                              : undefined,
                          background:
                            businessType === bt.value
                              ? primaryColor
                              : undefined,
                        }}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Loyalty Program */}
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
                    placeholder="e.g. Free coffee, 10% off, Free haircut"
                    maxLength={200}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                  />
                  <p className="text-xs text-slate-500 font-medium mt-2">
                    This is what customers earn after collecting enough stamps
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Stamps Required:{" "}
                    <span
                      className="text-base"
                      style={{ color: primaryColor }}
                    >
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
                    <span>3 (quick rewards)</span>
                    <span>20 (long loyalty)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Brand Color */}
            <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${primaryColor}20` }}
                >
                  <Palette size={18} style={{ color: primaryColor }} />
                </div>
                <h2 className="font-bold text-lg text-slate-900">
                  Brand Color
                </h2>
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
                          onClick={() => handleColorPick(c.hex)}
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
                            <svg
                              className="w-6 h-6 text-white drop-shadow"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
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
                    onChange={(e) => handleColorPick(e.target.value)}
                    className="w-14 h-14 rounded-xl cursor-pointer border-2 border-slate-200"
                  />
                  <input
                    type="text"
                    value={customColor || primaryColor}
                    onChange={(e) => handleCustomColor(e.target.value)}
                    placeholder="#4f46e5"
                    maxLength={7}
                    className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                  />
                  <div
                    className="w-12 h-12 rounded-xl shrink-0 border-2 border-slate-200"
                    style={{ background: primaryColor }}
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2">
                  Enter any hex color (e.g. #ff5722)
                </p>
              </div>
            </section>

            {/* URL Slug */}
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

              <label className="block text-sm font-bold text-slate-800 mb-2">
                Custom URL
              </label>
              <div className="flex items-center gap-2 border-2 border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition">
                <span className="pl-4 py-3 text-sm font-medium text-slate-500 whitespace-nowrap select-none">
                  {typeof window !== "undefined" ? window.location.origin : ""}/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    )
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
                {slugStatus === "available" && "✅ This URL is available"}
                {slugStatus === "taken" &&
                  "❌ This URL is already taken. Try a different one."}
                {slugStatus === "invalid" &&
                  "⚠️ Use 3+ characters, lowercase letters, numbers, and dashes only."}
                {slugStatus === "idle" &&
                  "Your QR code will point to this URL. Customers will see: " +
                    slugPreview}
                {slugStatus === "checking" && "Checking availability..."}
              </p>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Preview */}
              <div className="bg-white rounded-3xl shadow-sm p-5 border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Preview
                </p>
                <div
                  className="rounded-2xl overflow-hidden shadow-lg"
                  style={{
                    boxShadow: `0 4px 24px -8px ${primaryColor}60`,
                  }}
                >
                  <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/25 flex items-center justify-center shrink-0">
                        <Store size={16} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                          {name || "Your Business"}
                        </p>
                        <p className="text-white/80 text-[10px] capitalize font-medium">
                          {businessType}
                        </p>
                      </div>
                    </div>
                    <div className="text-white font-bold text-lg">8</div>
                  </div>
                  <div className="bg-white p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift size={12} style={{ color: primaryColor }} />
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {rewardDescription || "Your reward here"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({
                        length: Math.min(stampsRequired, 10),
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded"
                          style={{
                            background:
                              i < 3 ? primaryColor : `${primaryColor}20`,
                          }}
                        />
                      ))}
                      {stampsRequired > 10 && (
                        <span className="text-[10px] font-bold text-slate-500 ml-1">
                          +{stampsRequired - 10}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-lg"
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

              <p className="text-xs text-slate-500 text-center font-medium px-2">
                Changes apply to new stamps only. Existing customer stamps are
                kept.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}