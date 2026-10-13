"use client";

import { useEffect, useState } from "react";

export interface SubscriptionStatus {
  allowed: boolean;
  status: string;
  isTrial: boolean;
  isActive: boolean;
  isExpired: boolean;
  isPending: boolean;
  daysLeft: number | null;
  reason: string;
  trialEndsAt: string | null;
}

export function useSubscriptionStatus(merchantId: string | null) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch(`/api/merchant/${merchantId}/subscription`);
        if (res.ok) {
          const data = await res.json();
          setSubscription(data);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [merchantId]);

  return { subscription, loading };
}