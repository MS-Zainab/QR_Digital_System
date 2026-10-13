"use client";

import Link from "next/link";
import { MessageCircle, Mail } from "lucide-react";

export default function Footer({ variant = "light" }: { variant?: "light" | "dark" }) {
  const brand =
    process.env.NEXT_PUBLIC_BRAND_NAME || "QR Digital Loyalty System";
  const whatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";
  const year = new Date().getFullYear();

  const isDark = variant === "dark";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const textHover = isDark ? "hover:text-white" : "hover:text-slate-900";
  const borderColor = isDark ? "border-slate-800" : "border-slate-200";

  return (
    <footer
      className={`border-t ${borderColor} ${
        isDark ? "bg-slate-950" : "bg-white"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          {/* Brand + Copyright */}
          <div>
            <p
              className={`font-bold text-sm ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {brand}
            </p>
            <p className={`text-xs ${textMuted} font-medium mt-1`}>
              © {year} All rights reserved
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <Link
              href="/terms"
              className={`${textMuted} ${textHover} transition`}
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className={`${textMuted} ${textHover} transition`}
            >
              Privacy
            </Link>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  `Hi, I need help with ${brand}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${textMuted} ${textHover} transition flex items-center gap-1.5`}
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className={`${textMuted} ${textHover} transition flex items-center gap-1.5`}
              >
                <Mail size={14} />
                Email
              </a>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
}