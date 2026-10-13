"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "qr_loyalty_phone";

export function useSession() {
  const [phone, setPhone] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setPhone(stored);
    } catch {}
    setLoaded(true);
  }, []);

  const save = (value: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      setPhone(value);
    } catch {}
  };

  const clear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPhone(null);
    } catch {}
  };

  return { phone, loaded, save, clear };
}