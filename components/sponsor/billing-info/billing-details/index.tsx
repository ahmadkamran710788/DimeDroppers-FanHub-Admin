"use client";

import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { PANEL, SECTION_HEADING } from "@/components/sponsor/billing-info/data";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { SponsorProfileView } from "@/utils/types/sponsor-profile";

const MISSING = "—";

interface BillingDetailsProps {
  // The default methods, e.g. "Visa •••• 4242, Link"; empty when none is set, undefined while they load.
  paysWith?: string;
}

// Who the sponsor is billed as. There's no billing-details API yet, so it shows what the Sponsor Profile has
// (brand name, the account's email, the main location) with "—" for the rest, and Edit is "Coming soon".
export default function BillingDetails({ paysWith }: BillingDetailsProps) {
  // undefined while loading; null when the profile couldn't load (every row then shows "—").
  const [profile, setProfile] = useState<SponsorProfileView | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    sponsorRequest<SponsorProfileView>("GET", routes.api.sponsorProfile).then((r) => {
      if (!cancelled) setProfile(r.view ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const main = profile?.mainLocation;
  const rows = [
    { label: "Company", value: profile?.brand?.name },
    { label: "Billing email", value: profile?.account.email },
    {
      label: "Address",
      value: main && [main.address, main.city, main.state, main.zipCode].filter(Boolean).join(", "),
    },
    { label: "Tax ID (EIN)", value: null },
    { label: "Pays with", value: paysWith === undefined ? null : paysWith || "No default set" },
  ];

  return (
    <section aria-labelledby="billing-details-title" className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="billing-details-title" className={SECTION_HEADING}>
          Billing details
        </h3>
        <Button
          label="Edit"
          onClick={() => toast("Coming soon.")}
          className="h-10 min-w-0 px-3.5 rounded-[10px] border border-[#4f46e5] bg-[#13122b] text-base font-medium text-[#e0e7ff] backdrop-blur-none"
        />
      </div>
      <div className={cn(PANEL, "px-4 py-4 sm:px-[22px] sm:py-[18px]")}>
        {profile === undefined ? (
          <Loader />
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-[minmax(140px,200px)_1fr] gap-x-4 gap-y-1 sm:gap-y-3 text-[15px]">
            {rows.map((r) => (
              <Fragment key={r.label}>
                <dt className="text-[#a1a1aa]">{r.label}</dt>
                <dd className="mb-2 sm:mb-0 [overflow-wrap:anywhere]">{r.value || MISSING}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
