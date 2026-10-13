"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Store, Loader2, LogIn, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MerchantLoginPage() {
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

      router.push("/merchant/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo + Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <Store className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-indigo-600 text-sm mt-1 font-medium">
            Log in to your merchant dashboard
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5 border border-indigo-50">
          {/* Email Field */}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                autoComplete="email"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-indigo-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          {/* Password Field */}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-indigo-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm p-3 rounded-xl font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Log In
              </>
            )}
          </button>
        </div>

        <p className="text-center text-sm text-slate-600 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/merchant/signup"
            className="text-indigo-600 font-bold hover:text-indigo-700"
          >
            Start free trial
          </Link>
        </p>
      </motion.div>
    </main>
  );
}