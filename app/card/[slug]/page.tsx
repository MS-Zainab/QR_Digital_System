"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Store, Stamp, Gift, Calendar } from "lucide-react";
import { useSession } from "@/lib/useSession";

interface CardDetail {
  id: string;
  stampCount: number;
  isRedeemed: boolean;
  merchant: {
    id: string;
    name: string;
    slug: string | null;
    businessType: string;
    primaryColor: string;
    stampsRequired: number;
    rewardDescription: string;
  };
  history: {
    stamps: { id: string; at: string }[];
    redemptions: {
      id: string;
      rewardText: string;
      at: string;
      notes: string | null;
    }[];
  };
}

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { phone, loaded } = useSession();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loaded || !phone) return;

    const load = async () => {
      try {
        const res = await fetch(
          `/api/card/${params.slug}?phone=${encodeURIComponent(phone)}`
        );
        if (res.ok) {
          setCard(await res.json());
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [loaded, phone, params.slug]);

  if (!loaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Store size={48} className="text-slate-300 mb-4" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Card not found</h2>
        <p className="text-sm text-slate-500 mb-6">
          You don&apos;t have a card at this store yet.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          Back to My Cards
        </button>
      </div>
    );
  }

  const { merchant, history } = card;
  const rewardReady = card.stampCount >= merchant.stampsRequired;

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white pb-12">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-indigo-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition"
          >
            <ArrowLeft size={18} className="text-slate-700" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-slate-900 truncate">{merchant.name}</h1>
            <p className="text-xs text-slate-500 capitalize">
              {merchant.businessType}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        <div
          className="rounded-3xl overflow-hidden shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${merchant.primaryColor}, ${merchant.primaryColor}dd)`,
          }}
        >
          <div className="px-5 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Store className="text-white" size={22} />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">{merchant.name}</h2>
                <p className="text-white/80 text-xs capitalize">
                  {merchant.businessType}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-3xl leading-none">
                {rewardReady ? "🎁" : card.stampCount}
              </div>
              <div className="text-white/80 text-[10px] uppercase tracking-wider font-semibold">
                {rewardReady ? "Ready" : `of ${merchant.stampsRequired}`}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Gift className="text-indigo-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Reward</p>
              <p className="text-sm font-semibold text-slate-900">
                {merchant.rewardDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Stamp size={16} className="text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-900">
              Stamp History · {history.stamps.length}
            </h3>
          </div>
          {history.stamps.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No stamps yet at this store
            </p>
          ) : (
            <div className="space-y-2">
              {history.stamps.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-50"
                >
                  <span className="font-medium text-slate-700">+1 stamp</span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(s.at).toLocaleDateString("en-PK", {
                      timeZone: "Asia/Karachi",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={16} className="text-emerald-600" />
            <h3 className="font-semibold text-sm text-slate-900">
              Redemptions · {history.redemptions.length}
            </h3>
          </div>
          {history.redemptions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No rewards redeemed yet at this store
            </p>
          ) : (
            <div className="space-y-2">
              {history.redemptions.map((r) => (
                <div key={r.id} className="py-2 px-3 rounded-lg bg-emerald-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-emerald-900">
                      {r.rewardText}
                    </span>
                    <span className="text-xs text-emerald-700 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(r.at).toLocaleDateString("en-PK", {
                        timeZone: "Asia/Karachi",
                      })}
                    </span>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-emerald-700 mt-0.5">{r.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}