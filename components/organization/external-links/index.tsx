"use client";

import ExternalLinkCard from "@/components/organization/external-links/external-link-card";
import { EXTERNAL_LINKS } from "@/components/organization/external-links/data";
import { orgKindOf, useAuth } from "@/context/auth";

export default function ExternalLinksPage() {
  // A tournament only links its team store; GoFan and NFHS Network are for schools.
  const { org } = useAuth();
  const isTournament = orgKindOf(org) === "tournament";
  const links = isTournament ? EXTERNAL_LINKS.filter((l) => !l.schoolOnly) : EXTERNAL_LINKS;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-display font-black text-[40px] sm:text-[52px] lg:text-[64px] text-white leading-none">
          External Links
        </h1>
        <p className="text-base lg:text-xl text-white/85">
          {isTournament
            ? "Add your team store link so fans can easily shop your official gear."
            : "Add external links for ticketing, live streaming and your team store so fans can easily access your games and gear."}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {links.map((link) => (
          <ExternalLinkCard key={link.id} config={link} />
        ))}
      </div>
    </div>
  );
}
