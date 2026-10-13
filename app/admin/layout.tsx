"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  FileText,
  BarChart3,
  Users,
  Megaphone,
} from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Don't apply layout chrome on the login page
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  const tabs = [
    {
      id: "/admin/overview",
      label: "Overview",
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: "/admin/vendors",
      label: "Vendors",
      icon: <Store size={16} />,
    },
    {
      id: "/admin/subscriptions",
      label: "Subscriptions",
      icon: <CreditCard size={16} />,
    },
    {
      id: "/admin/broadcast",
      label: "Broadcast",
      icon: <Megaphone size={16} />,
    },
    {
      id: "/admin/reports",
      label: "Reports",
      icon: <FileText size={16} />,
    },
    {
      id: "/admin/analytics",
      label: "Analytics",
      icon: <BarChart3 size={16} />,
    },
    {
      id: "/admin/customers",
      label: "Customers",
      icon: <Users size={16} />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur">
                <BarChart3 size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-xs text-white/80 font-medium">
                  QR Digital Loyalty
                </p>
              </div>
            </div>

            {/* No theme toggle — light mode only */}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((t) => {
              const isActive = pathname === t.id;
              return (
                <Link
                  key={t.id}
                  href={t.id}
                  className={`flex items-center gap-2 px-5 py-3 font-bold text-sm whitespace-nowrap rounded-t-xl transition ${
                    isActive
                      ? "bg-slate-50 text-indigo-600"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}