"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, LogOut, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/merchant/login");
        return;
      }

      setEmail(user.email || "");

      const res = await fetch(
        `/api/merchant/by-email?email=${encodeURIComponent(user.email!)}`
      );
      if (res.ok) {
        const m = await res.json();
        if (m.subscriptionStatus !== "PENDING_APPROVAL") {
          router.push("/merchant/dashboard");
          router.refresh();
        }
      }
    }

    check();

    const interval = setInterval(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(
        `/api/merchant/by-email?email=${encodeURIComponent(user.email!)}`
      );
      if (res.ok) {
        const m = await res.json();
        if (m.subscriptionStatus !== "PENDING_APPROVAL") {
          router.push("/merchant/dashboard");
          router.refresh();
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/merchant/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full"
          >
            <Clock className="text-amber-600" size={36} />
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Account Pending Review
            </h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Thanks for signing up! Your account is being reviewed by our
              team. You&apos;ll get access once approved — usually within a few
              hours.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Mail size={12} />
              Registered email
            </div>
            <p className="text-sm font-medium text-gray-900 break-all">
              {email}
            </p>
          </div>

          <div className="space-y-3 text-left text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle2
                size={16}
                className="text-green-500 mt-0.5 shrink-0"
              />
              <span>Your account was created successfully</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <span>Waiting for admin approval</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <span>
                You&apos;ll be notified at <strong>{email}</strong> once
                approved
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            This page will auto-refresh every 30 seconds.
          </p>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </motion.div>
    </main>
  );
}