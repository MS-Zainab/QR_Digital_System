"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  MessageCircle,
  Sparkles,
  AlertCircle,
  Copy,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface Customer {
  customerId: string;
  name: string | null;
  phoneNumber: string;
  stampCount: number;
  totalVisits: number;
  totalRedemptions: number;
  marketingConsent: boolean;
  lastVisit: string;
}

type Audience =
  | "all-opted"
  | "almost-rewarded"
  | "inactive"
  | "reward-ready"
  | "all";

export default function SendPromotionModal({
  merchantId,
  merchantName,
  stampsRequired,
  color,
  onClose,
}: {
  merchantId: string;
  merchantName: string;
  stampsRequired: number;
  color: string;
  onClose: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    `Hi {name}, come back to ${merchantName}! 🎁 20% off this weekend with code WEEKEND20.`
  );
  const [audience, setAudience] = useState<Audience>("all-opted");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch customers
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/merchant/${merchantId}/customers`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [merchantId]);

  // Filter customers by audience
  const getAudience = (): Customer[] => {
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).getTime();

    switch (audience) {
      case "all-opted":
        return customers.filter((c) => c.marketingConsent);
      case "almost-rewarded":
        return customers.filter(
          (c) =>
            c.stampCount > 0 &&
            c.stampCount < stampsRequired &&
            stampsRequired - c.stampCount <= 2
        );
      case "reward-ready":
        return customers.filter((c) => c.stampCount >= stampsRequired);
      case "inactive":
        return customers.filter(
          (c) => new Date(c.lastVisit).getTime() < thirtyDaysAgo
        );
      case "all":
        return customers;
      default:
        return [];
    }
  };

  const targetedCustomers = getAudience();

  // Personalize message
  const personalize = (customer: Customer): string => {
    return message
      .replace(/\{name\}/g, customer.name || "there")
      .replace(/\{business\}/g, merchantName)
      .replace(/\{stamps\}/g, String(customer.stampCount))
      .replace(/\{reward\}/g, "your reward");
  };

  // WhatsApp link
  const getWhatsAppLink = (customer: Customer): string => {
    const text = personalize(customer);
    // Strip leading + and non-digits
    const phone = customer.phoneNumber.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Copy all WhatsApp links
  const copyAllWhatsApp = async () => {
    const allLinks = targetedCustomers
      .map((c) => `• ${c.name || c.phoneNumber}: ${getWhatsAppLink(c)}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(allLinks);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const audienceOptions: {
    value: Audience;
    label: string;
    count: number;
    description: string;
  }[] = [
    {
      value: "all-opted",
      label: "Opted-in Customers",
      count: customers.filter((c) => c.marketingConsent).length,
      description: "Customers who agreed to receive promotions",
    },
    {
      value: "almost-rewarded",
      label: "Almost Rewarded",
      count: customers.filter(
        (c) =>
          c.stampCount > 0 &&
          c.stampCount < stampsRequired &&
          stampsRequired - c.stampCount <= 2
      ).length,
      description: "1-2 stamps away from their reward",
    },
    {
      value: "reward-ready",
      label: "Reward Ready",
      count: customers.filter((c) => c.stampCount >= stampsRequired).length,
      description: "Customers who can redeem now",
    },
    {
      value: "inactive",
      label: "Inactive (30+ days)",
      count: customers.filter(
        (c) =>
          new Date(c.lastVisit).getTime() <
          Date.now() - 30 * 24 * 60 * 60 * 1000
      ).length,
      description: "Haven't visited in 30+ days",
    },
    {
      value: "all",
      label: "All Customers",
      count: customers.length,
      description: "Every customer (some may not have opted in)",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Send Promotion
                </h2>
                <p className="text-xs text-white/90 font-medium">
                  Personalized WhatsApp messages
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin" size={28} style={{ color }} />
              </div>
            ) : (
              <>
                {/* Template */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Message Template
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition resize-none"
                    placeholder="Type your message..."
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-slate-500 font-semibold">
                      Variables:
                    </span>
                    {["{name}", "{business}", "{stamps}", "{reward}"].map(
                      (v) => (
                        <button
                          key={v}
                          onClick={() => setMessage(message + " " + v)}
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        >
                          {v}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Audience */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Choose Audience
                  </label>
                  <div className="space-y-2">
                    {audienceOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setAudience(opt.value);
                          setGenerated(false);
                        }}
                        disabled={opt.count === 0}
                        className={`w-full text-left p-3 rounded-xl border-2 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                          audience === opt.value
                            ? "border-2 shadow-sm"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        style={{
                          borderColor:
                            audience === opt.value ? color : undefined,
                          background:
                            audience === opt.value ? `${color}08` : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-900">
                              {opt.label}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                              {opt.description}
                            </p>
                          </div>
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{
                              background:
                                audience === opt.value
                                  ? `${color}20`
                                  : "#f1f5f9",
                              color:
                                audience === opt.value ? color : "#64748b",
                            }}
                          >
                            {opt.count}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {targetedCustomers.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Preview (first customer)
                    </label>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {personalize(targetedCustomers[0])}
                      </p>
                    </div>
                  </div>
                )}

                {/* Warning if no opted-in */}
                {audience === "all" &&
                  customers.filter((c) => !c.marketingConsent).length > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle
                        className="text-amber-600 shrink-0 mt-0.5"
                        size={16}
                      />
                      <p className="text-xs text-amber-800 font-medium">
                        ⚠️{" "}
                        {
                          customers.filter((c) => !c.marketingConsent).length
                        }{" "}
                        customers have NOT opted in. Sending promotions to
                        them may be illegal in some regions.
                      </p>
                    </div>
                  )}

                {/* Generated Links */}
                {generated && targetedCustomers.length > 0 && (
                  <motion.div
                    ref={scrollRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-sm font-bold text-slate-800">
                        Ready to Send ({targetedCustomers.length})
                      </label>
                      <button
                        onClick={copyAllWhatsApp}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 size={12} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy all links
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {targetedCustomers.map((c) => (
                        <div
                          key={c.customerId}
                          className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-slate-900 truncate">
                              {c.name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500 font-mono truncate">
                              {c.phoneNumber}
                            </p>
                            {!c.marketingConsent && (
                              <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                                ⚠️ No opt-in
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <a
                              href={getWhatsAppLink(c)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                              style={{ background: "#25D366" }}
                            >
                              <MessageCircle size={14} />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 font-medium">
                      💡 <strong>How to send:</strong> Click the WhatsApp
                      button per customer. WhatsApp Web will open with the
                      message pre-filled. Tap Send. Repeat for each customer.
                    </div>
                  </motion.div>
                )}

                {/* Empty state */}
                {targetedCustomers.length === 0 && (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                    <Users className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm text-slate-500 font-medium">
                      No customers in this audience
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-3xl">
            {!generated ? (
              <button
                onClick={() => {
                  setGenerated(true);
                  setTimeout(() => {
                    scrollRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 100);
                }}
                disabled={
                  targetedCustomers.length === 0 || !message.trim() || loading
                }
                className="w-full text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
                style={{
                  background: color,
                  boxShadow: `0 8px 20px -8px ${color}`,
                }}
              >
                <Sparkles size={18} />
                Generate WhatsApp Links for {targetedCustomers.length} Customer
                {targetedCustomers.length === 1 ? "" : "s"}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold text-base hover:bg-slate-200 transition"
              >
                Done
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}