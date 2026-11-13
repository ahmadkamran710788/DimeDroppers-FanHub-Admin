import { cn } from "@/utils/cn";
import { CARD } from "@/components/sponsor/styles";
import { SAMPLE_SLOTS } from "@/components/sponsor/brand-placements/data";
import type { TemplateId } from "@/components/sponsor/brand-placements/purchased-inventory/data";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

interface StatsStripProps {
  // Logo variants uploaded, out of `logoTotal`.
  logosUploaded: number;
  logoTotal: number;
}

// The slots bought and how they're set up (sample slots), and the logo versions uploaded.
export default function StatsStrip({ logosUploaded, logoTotal }: StatsStripProps) {
  const count = (t: TemplateId) => SAMPLE_SLOTS.filter((s) => s.template === t).length;
  const orgs = new Set(SAMPLE_SLOTS.map((s) => s.orgId)).size;
  const surveys = count("SURVEY");
  const offers = count("OFFER_PROMO_CODE");
  const missing = logoTotal - logosUploaded;

  const stats = [
    { label: "INVENTORY SLOTS", value: String(SAMPLE_SLOTS.length), sub: `bought across ${plural(orgs, "organization")}` },
    { label: "VISIT WEBSITE", value: String(count("VISIT_WEBSITE")), sub: "slots sending traffic" },
    { label: "SIMPLE BPA", value: String(count("SIMPLE_BPA")), sub: "logo-only slots (default)" },
    { label: "SURVEY & OFFER", value: String(surveys + offers), sub: `${plural(surveys, "survey")} · ${plural(offers, "offer")}` },
    {
      label: "LOGO VARIANTS",
      value: `${logosUploaded} / ${logoTotal}`,
      sub: missing ? `${missing} still needed for your slots` : "every screen covered",
    },
  ];

  return (
    <div className="flex flex-wrap gap-[14px]">
      {stats.map((s) => (
        <div key={s.label} className={cn(CARD, "flex-[1_1_180px] rounded-[12px] px-[18px] py-4 flex flex-col gap-1")}>
          <span className="text-xs font-semibold tracking-[1px] text-[#a8a8a8]">{s.label}</span>
          <span className="font-display font-black text-[30px] leading-tight">{s.value}</span>
          <span className="text-[13px] text-[#a8a8a8]">{s.sub}</span>
        </div>
      ))}
    </div>
  );
}
