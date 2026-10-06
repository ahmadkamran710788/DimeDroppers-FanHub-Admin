"use client";

import ExternalLinkCard from "@/components/external-links/external-link-card";
import { EXTERNAL_LINKS } from "@/components/external-links/data";

export default function ExternalLinksPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-display font-black text-[40px] sm:text-[52px] lg:text-[64px] text-white leading-none">
          External Links
        </h1>
        <p className="text-base lg:text-xl text-white/85">
          Add external links for ticketing, live streaming and your team store so fans can easily access your games and gear.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {EXTERNAL_LINKS.map((link) => (
          <ExternalLinkCard key={link.id} config={link} />
        ))}
      </div>
    </div>
  );
}
