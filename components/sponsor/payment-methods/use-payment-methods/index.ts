"use client";

import { useCallback, useEffect, useState } from "react";
import { sponsorList, sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { PaymentMethodOptions, SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

interface Loaded {
  methods?: SponsorPaymentMethod[];
  options?: PaymentMethodOptions;
  // The list's error (e.g. 409 "Complete your sponsor profile…") and its status.
  error?: string;
  errorStatus?: number;
}

// The sponsor's saved payment methods (GET /payment-methods, the list directly in `data`) and what can be
// added (GET /payment-methods/options). Loads when `enabled`, and again on reload(); the last answer stays
// shown while a reload runs.
export function usePaymentMethods({ enabled = true }: { enabled?: boolean } = {}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    Promise.all([
      sponsorList<SponsorPaymentMethod>(routes.api.sponsorPaymentMethods),
      sponsorRequest<PaymentMethodOptions>("GET", routes.api.sponsorPaymentMethodOptions),
    ]).then(([list, options]) => {
      if (cancelled) return;
      setLoaded({
        methods: list.items,
        options: options.view,
        error: list.items ? undefined : list.message,
        errorStatus: list.items ? undefined : list.status,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, reloads]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);

  return {
    methods: loaded?.methods,
    options: loaded?.options,
    error: loaded?.error,
    errorStatus: loaded?.errorStatus,
    loading: !loaded,
    reload,
  };
}
