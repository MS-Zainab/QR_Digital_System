"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "qr_admin_theme";

// 🎨 Dark mode is disabled. Always returns "light".
export function useTheme() {
  const [theme] = useState<Theme>("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      // Force light mode and clear any old dark preference
      localStorage.setItem(STORAGE_KEY, "light");
    } catch {}

    // Ensure no dark class on the root element
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }

    setLoaded(true);
  }, []);

  return {
    theme,             // always "light"
    loaded,
    toggle: () => {},  // no-op — button won't change anything
    setTheme: (_: Theme) => {}, // no-op
  };
}