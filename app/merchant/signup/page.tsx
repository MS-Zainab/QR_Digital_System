"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Store, Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COLOR_CATEGORIES } from "@/lib/colorPalette";
import Footer from "@/components/Footer";

const BUSINESS_TYPES = [
  { value: "cafe", label: "Cafe" },
  { value: "restaurant", label: "Restaurant" },
  { value: "salon", label: "Salon" },
  { value: "retail", label: "Retail Shop" },
];

export default function MerchantSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    password: "",
    businessType: "cafe",
    rewardDescription: "",
    stampsRequired: 10,
    primaryColor: "#4f46e5",
  });

  const update = (key: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setError(null);

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.toLowerCase(),
        password: form.password,
      });

      if (signInError) {
        setError("Account created! But auto-login failed. Please log in.");
        setLoading(false);
        router.push("/merchant/login");
        return;
      }

      router.push("/merchant/dashboard");
      router.refresh();
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
              <Store className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Start your free trial
            </h1>
            <p className="text-indigo-600 text-sm mt-1 font-medium">
              15 days free. No credit card needed.
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition ${
                  step >= i ? "bg-indigo-600" : "bg-indigo-100"
                }`}
              />
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5 border border-indigo-50">
            {/* Step 1 — Business info */}
            {step === 1 && (
              <>
                <h2 className="font-bold text-lg text-slate-900">
                  Business details
                </h2>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => update("businessName", e.target.value)}
                    placeholder="e.g. Cafe Bliss"
                    className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Business Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_TYPES.map((bt) => (
                      <button
                        key={bt.value}
                        onClick={() => update("businessType", bt.value)}
                        className={`py-3 rounded-xl border-2 font-semibold text-sm transition ${
                          form.businessType === bt.value
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                            : "border-indigo-100 text-slate-700 bg-white hover:border-indigo-300"
                        }`}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!form.businessName}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200"
                >
                  Next <ArrowRight size={18} />
                </button>
              </>
            )}

            {/* Step 2 — Loyalty program */}
            {step === 2 && (
              <>
                <h2 className="font-bold text-lg text-slate-900">
                  Your loyalty program
                </h2>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Reward Description
                  </label>
                  <input
                    type="text"
                    value={form.rewardDescription}
                    onChange={(e) =>
                      update("rewardDescription", e.target.value)
                    }
                    placeholder="e.g. Free coffee"
                    className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Stamps needed for reward:{" "}
                    <span className="text-indigo-600 text-base">
                      {form.stampsRequired}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={20}
                    value={form.stampsRequired}
                    onChange={(e) =>
                      update("stampsRequired", Number(e.target.value))
                    }
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mt-1">
                    <span>3</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Brand Color with categories */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Brand Color
                  </label>
                  <div className="max-h-64 overflow-y-auto pr-2 space-y-4 bg-slate-50 rounded-2xl p-3 border border-slate-200">
                    {COLOR_CATEGORIES.map((cat) => (
                      <div key={cat.label}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          {cat.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cat.colors.map((c) => {
                            const isSelected = form.primaryColor === c.hex;
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => update("primaryColor", c.hex)}
                                title={c.name}
                                className="relative w-10 h-10 rounded-full transition-all cursor-pointer flex items-center justify-center hover:scale-110"
                                style={{
                                  background: c.hex,
                                  transform: isSelected
                                    ? "scale(1.15)"
                                    : "scale(1)",
                                  boxShadow: isSelected
                                    ? `0 0 0 3px white, 0 0 0 5px ${c.hex}`
                                    : "0 2px 4px rgba(0,0,0,0.1)",
                                }}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-5 h-5 text-white drop-shadow"
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
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
                    />
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {form.primaryColor}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!form.rewardDescription}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200"
                  >
                    Next <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — Account */}
            {step === 3 && (
              <>
                <h2 className="font-bold text-lg text-slate-900">
                  Create your account
                </h2>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@business.com"
                      autoComplete="email"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-indigo-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-indigo-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs text-slate-600 leading-relaxed font-medium cursor-pointer"
                  >
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-indigo-600 underline font-semibold"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      className="text-indigo-600 underline font-semibold"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm p-3 rounded-xl font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3.5 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={submit}
                    disabled={
                      loading ||
                      !form.email ||
                      form.password.length < 6 ||
                      !agreedToTerms
                    }
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Start Free Trial"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{" "}
            <Link
              href="/merchant/login"
              className="text-indigo-600 font-bold hover:text-indigo-700"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </main>

      <Footer variant="light" />
    </div>
  );
}