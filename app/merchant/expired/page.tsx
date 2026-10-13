"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  LogOut,
  Mail,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MerchantInfo {
  name: string;
  email: string;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  subscriptionStatus: string;
  customPricePerMonth: number | null;
}

export default function ExpiredPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState(true);

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
        router.push("/merchant/login");
        return;
      }
      const m = await res.json();
      setMerchant(m);
      setLoading(false);
    }
    load();
    document.title = "Subscription Expired · QR Digital Loyalty";
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/merchant/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!merchant) return null;

  const expiredDate = merchant.trialEndsAt || merchant.currentPeriodEndsAt;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-rose-100">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center"
            >
              <AlertTriangle className="text-rose-600" size={40} />
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {merchant.subscriptionStatus === "EXPIRED"
                ? "Your trial has ended"
                : "Your account is paused"}
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              {merchant.name}
            </p>
            {expiredDate && (
              <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1 font-semibold">
                <Calendar size={12} />
                Expired on{" "}
                {new Date(expiredDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Info */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-rose-900 font-medium leading-relaxed">
              Your store is <strong>temporarily unavailable to customers</strong>.
              They can&apos;t scan or earn stamps until you reactivate.
            </p>
          </div>

          {/* What happens next */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              To reactivate:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2
                  size={16}
                  className="text-emerald-500 mt-0.5 shrink-0"
                />
                <span className="text-slate-700 font-medium">
                  Contact us on WhatsApp or email
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2
                  size={16}
                  className="text-emerald-500 mt-0.5 shrink-0"
                />
                <span className="text-slate-700 font-medium">
                  We&apos;ll set up your monthly plan (
                  {merchant.customPricePerMonth
                    ? `${merchant.customPricePerMonth} PKR/month`
                    : "custom pricing"}
                  )
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2
                  size={16}
                  className="text-emerald-500 mt-0.5 shrink-0"
                />
                <span className="text-slate-700 font-medium">
                  Your store is back online instantly
                </span>
              </div>
            </div>
          </div>

          {/* Important note */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-6 text-xs text-slate-600 font-medium text-center">
            ✅ Your customer data, stamps, and rewards are <strong>safe</strong>.
            Nothing is deleted.
          </div>

          {/* CTAs */}
          <div className="space-y-3">
                       <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "923001234567"}?text=Hi%2C%20I%27d%20like%20to%20reactivate%20my%20QR%20Digital%20Loyalty%20account%20for%20${encodeURIComponent(merchant.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition shadow-md"
            >
              <MessageCircle size={18} />
              Contact on WhatsApp
            </a>
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com"}?subject=Reactivate%20${encodeURIComponent(merchant.name)}'s%20account`}
              className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-900 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition"
            >
              <Mail size={18} />
              Email Support
            </a>
          </div>

          {/* Logout */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1.5 mx-auto transition"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}