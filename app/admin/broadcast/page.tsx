"use client";

import { useState } from "react";
import { useTheme } from "@/lib/useTheme";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminBroadcastPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setToast({ type: "error", msg: "Title and message are required" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (res.ok) {
        const d = await res.json();
        setToast({ type: "success", msg: `Sent to ${d.sent || 0} merchant(s)` });
        setTitle("");
        setBody("");
      } else {
        setToast({ type: "error", msg: "Failed to send" });
      }
    } catch {
      setToast({ type: "error", msg: "Network error" });
    }
    setSending(false);
    setTimeout(() => setToast(null), 4000);
  };

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const inputBg = isDark
    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className={`text-xl font-semibold ${textPrimary}`}>Broadcast</h2>
        <p className={`text-sm ${textMuted} mt-0.5`}>
          Send an in-app notification to all merchants
        </p>
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 border ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </motion.div>
      )}

      <section className={`rounded-xl border ${cardBg} p-5 space-y-4`}>
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider ${textMuted} mb-2`}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New features available"
            className={`w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500/50 transition ${inputBg}`}
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider ${textMuted} mb-2`}>
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Write your message..."
            className={`w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none ${inputBg}`}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => { setTitle(""); setBody(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              isDark
                ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                : "border-slate-300 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Clear
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send Broadcast
          </button>
        </div>
      </section>
    </div>
  );
}