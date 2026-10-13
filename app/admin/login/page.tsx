"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Shield, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login failed");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        await supabase.auth.signOut();
        setError("Access denied — you are not an admin");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl mb-4 shadow-lg shadow-rose-500/30">
            <Shield className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-rose-400 text-sm mt-1 font-medium">
            Authorized personnel only
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-3xl p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-100 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border-2 border-slate-600 text-white placeholder:text-slate-500 rounded-xl text-base font-medium focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-100 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border-2 border-slate-600 text-white placeholder:text-slate-500 rounded-xl text-base font-medium focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-900/30 border-2 border-rose-700 text-rose-200 text-sm p-3 rounded-xl font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-rose-500/20"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Lock size={18} />
                Access Admin Panel
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          This page is not publicly linked
        </p>
      </motion.div>
    </main>
  );
}