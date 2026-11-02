import { Heart, MapPin, Megaphone, Sparkles, Star, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import ProgressBar from "@/components/common/progress-bar";
import { cn } from "@/utils/cn";

// SAMPLE DATA — there is no donors or donations endpoint yet. One donor's recognition, used by the
// donor templates and their preview until the backend exists.

export type DonorTemplate = "Profile & Campaign" | "Campaign" | "Profile";

export const DONOR_TEMPLATES: { name: DonorTemplate; description: string; gradient: string }[] = [
  {
    name: "Profile & Campaign",
    description: "The donor, the campaign they gave to, their badges and a thank-you.",
    gradient: "linear-gradient(160deg,#0F766E,#0E7490 55%,#164E63)",
  },
  {
    name: "Campaign",
    description: "Leads with the campaign the gift supported, then badges and a thank-you.",
    gradient: "linear-gradient(160deg,#7C3AED,#6D28D9 55%,#4C1D95)",
  },
  {
    name: "Profile",
    description: "Leads with the donor, then badges and a thank-you.",
    gradient: "linear-gradient(160deg,#B45309,#A16207 55%,#713F12)",
  },
];

export interface DonorBadge {
  label: string;
  icon: (cls: string) => ReactNode;
}

export interface DonorRecognition {
  donor: { name: string; location: string; since: string; totalGiven: number };
  campaign: { name: string; team: string; raised: number; goal: number };
  badges: DonorBadge[];
  description: string;
}

export const SAMPLE_DONOR: DonorRecognition = {
  donor: { name: "Thomas Family", location: "Jacksonville, FL", since: "Donor since 2023", totalGiven: 2500 },
  campaign: { name: "New Scoreboard Fund", team: "TLAM Boys Basketball", raised: 7800, goal: 10000 },
  badges: [
    { label: "Top Donor", icon: (c) => <Trophy className={c} strokeWidth={2} /> },
    { label: "Season Supporter", icon: (c) => <Star className={c} strokeWidth={2} /> },
    { label: "First Gift", icon: (c) => <Sparkles className={c} strokeWidth={2} /> },
  ],
  description: "Thank you to the Thomas Family for their generous gift to the new scoreboard fund. Our athletes will play under it for years to come.",
};

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const DIVIDER = "pb-4 border-b border-white/20";

function Profile({ donor }: { donor: DonorRecognition["donor"] }) {
  return (
    <div className={cn("flex items-center gap-3", DIVIDER)}>
      <span className="size-14 shrink-0 rounded-full bg-white/15 ring-2 ring-white/30 flex items-center justify-center text-lg font-bold">
        {initials(donor.name)}
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-lg font-bold leading-tight truncate">{donor.name}</span>
        <span className="flex items-center gap-1 text-xs text-white/75">
          <MapPin className="size-3.5 shrink-0" strokeWidth={2} />
          {donor.location} · {donor.since}
        </span>
      </div>
      <div className="ml-auto flex flex-col items-end shrink-0">
        <span className="text-[11px] uppercase text-white/70">Total given</span>
        <span className="text-base font-bold">{money(donor.totalGiven)}</span>
      </div>
    </div>
  );
}

function Campaign({ campaign }: { campaign: DonorRecognition["campaign"] }) {
  return (
    <div className={cn("flex flex-col gap-2", DIVIDER)}>
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Megaphone className="size-4 shrink-0" strokeWidth={2} />
        {campaign.name}
      </span>
      <span className="text-xs text-white/75">{campaign.team}</span>
      <ProgressBar
        percent={(campaign.raised / campaign.goal) * 100}
        ariaLabel={`${campaign.name} progress`}
        className="bg-white/20"
        barClassName="bg-white"
      />
      <span className="text-xs text-white/85">{`${money(campaign.raised)} raised of ${money(campaign.goal)}`}</span>
    </div>
  );
}

interface DonorCardProps {
  template: DonorTemplate;
  data: DonorRecognition;
  className?: string;
}

// A donor recognition as fans will see it. The template picks the top: the donor and the campaign
// ("Profile & Campaign"), the campaign only ("Campaign") or the donor only ("Profile"); every template
// then shows the badges and the description.
export default function DonorCard({ template, data, className }: DonorCardProps) {
  const style = DONOR_TEMPLATES.find((t) => t.name === template) ?? DONOR_TEMPLATES[0];
  return (
    <div className={cn("rounded-[14px] p-5 flex flex-col gap-4 text-white text-left", className)} style={{ background: style.gradient }}>
      {template !== "Campaign" && <Profile donor={data.donor} />}
      {template !== "Profile" && <Campaign campaign={data.campaign} />}

      <div className="flex flex-wrap gap-2">
        {data.badges.map((b) => (
          <span key={b.label} className="h-8 px-3 rounded-full flex items-center gap-1.5 bg-white/15 text-xs font-semibold">
            {b.icon("size-3.5 shrink-0 text-amber-300")}
            {b.label}
          </span>
        ))}
      </div>

      <p className="text-[15px] font-semibold leading-snug flex gap-2">
        <Heart className="size-4 mt-0.5 shrink-0 fill-current text-rose-300" strokeWidth={2} />
        {data.description}
      </p>
    </div>
  );
}
