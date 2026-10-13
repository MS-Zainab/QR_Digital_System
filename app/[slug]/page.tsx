"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Store, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function MerchantSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string)?.toLowerCase();
  const [status, setStatus] = useState<"loading" | "found" | "error">(
    "loading"
  );
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    // Reserved slugs we should not resolve
    const reserved = ["admin", "merchant", "api", "camera-test"];
    if (reserved.includes(slug)) {
      setStatus("error");
      setError("Invalid URL");
      return;
    }

    async function load() {
      try {
        const res = await fetch(`/api/merchant/slug/${slug}`);
        if (!res.ok) {
          setStatus("error");
          setError(
            res.status === 404
              ? "This store doesn't exist"
              : "Store temporarily unavailable"
          );
          return;
        }
        const data = await res.json();
        setMerchantId(data.id);
        setStatus("found");

        // Redirect to home with the merchant ID pre-loaded
        router.replace(`/?m=${data.id}`);
      } catch {
        setStatus("error");
        setError("Network error");
      }
    }
    load();
  }, [slug, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        {status === "loading" && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-5 shadow-xl shadow-indigo-200">
              <Store className="text-white" size={36} />
            </div>
            <Loader2
              className="animate-spin mx-auto mb-3 text-indigo-500"
              size={28}
            />
            <p className="text-sm text-slate-500 font-medium">
              Loading store...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-100 rounded-3xl mb-5">
              <AlertCircle className="text-rose-600" size={36} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Store not found
            </h1>
            <p className="text-sm text-slate-500 font-medium mb-6">
              {error || "The URL you're looking for doesn't exist."}
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200"
            >
              Go to Home
            </button>
          </>
        )}
      </motion.div>
    </main>
  );
}