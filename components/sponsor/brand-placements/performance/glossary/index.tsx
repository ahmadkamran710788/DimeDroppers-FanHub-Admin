import { cn } from "@/utils/cn";
import { CARD } from "@/components/sponsor/styles";

const TERMS = [
  ["Fans who saw your ad", "different fans who had the slot on their screen for at least one second."],
  ["Website visits", "fans who tapped through to your site. Click-through rate = visits ÷ fans who saw it."],
  ["Surveys completed", "fans who sent their answer. Completion rate = completed ÷ fans who saw it."],
  ["Offers redeemed", "fans who used your code at checkout. Redemption rate = redeemed ÷ fans who saw it."],
  ["Simple BPA", "logo-only slots are measured by how many fans saw your logo."],
  [
    "Changed setups",
    "when you switch a slot’s setup, results before the switch stay with the old setup and new results count toward the new one from that day. Rates only use fans who saw that setup, so they’re never mixed. Totals at the top add up every setup.",
  ],
];

// What each number on Performance means.
export default function Glossary() {
  return (
    <details className={cn(CARD, "rounded-[12px] px-[18px] py-[14px] text-sm leading-[1.6] text-[#d4d4d8]")}>
      <summary className="min-h-7 cursor-pointer font-semibold text-white">What each number means</summary>
      <ul className="mt-[10px] pl-5 list-disc flex flex-col gap-1.5">
        {TERMS.map(([term, meaning]) => (
          <li key={term}>
            <strong className="font-semibold">{term}:</strong> {meaning}
          </li>
        ))}
      </ul>
    </details>
  );
}
