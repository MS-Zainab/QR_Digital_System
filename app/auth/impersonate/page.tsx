"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ⚠️ Next.js requires useSearchParams() to be inside Suspense boundary
// so this file has: default export -> wrapper -> inner component
export default function ImpersonateCallback() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="text-center">
            <Loader2
              className="animate-spin text-indigo-500 mx-auto mb-3"
              size={32}
            />
            <p className="text-sm text-slate-600 font-medium">Loading...</p>
          </div>
        </main>
      }
    >
      <ImpersonateHandler />
    </Suspense>
  );
}

function ImpersonateHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function process() {
      const token_hash = searchParams.get("token_hash");
      const email = searchParams.get("email");

      if (!token_hash) {
        setError("Missing token");
        return;
      }

      const supabase = createClient();

      // CRITICAL: Sign out current session first (clears admin cookies)
      await supabase.auth.signOut();

      // Wait a moment to ensure cookies are cleared
      await new Promise((r) => setTimeout(r, 100));

      // Now verify the magic link token to establish NEW session
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash,
      });

      if (verifyError) {
        console.error("Impersonate verify error:", verifyError);
        setError(verifyError.message);
        return;
      }

      // Redirect to merchant dashboard
      router.replace("/merchant/dashboard");
      router.refresh();
    }

    process();
  }, [searchParams, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center max-w-sm">
          <AlertCircle className="mx-auto text-rose-500 mb-3" size={48} />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Impersonation failed
          </h1>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/admin")}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold"
          >
            Back to Admin
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="text-center">
        <Loader2
          className="animate-spin text-indigo-500 mx-auto mb-3"
          size={32}
        />
        <p className="text-sm text-slate-600 font-medium">
          Switching to merchant account...
        </p>
      </div>
    </main>
  );
}