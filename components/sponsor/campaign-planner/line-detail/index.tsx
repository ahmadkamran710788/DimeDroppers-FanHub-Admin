import { MapPin } from "lucide-react";
import { plural } from "@/utils/helper";
import { dollars } from "@/utils/needs";
import { EYEBROW } from "@/components/sponsor/styles";
import { formatAddress } from "@/components/sponsor/profile/data";
import type { SponsorPlanLine } from "@/utils/types/sponsor-plan";

// Why each line is in the plan (FANHUB_SPONSOR_PLAN_CHANGES_21_NOV_FRONTEND.md §1–2): its reach, share of the
// budget and cost per person on the row, and the server's facts and the nearest stores in the opened detail.

const count = (n: number) => n.toLocaleString("en-US");
const miles = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} mi`;

// Who the line reaches, by what the API counted: students, rostered players, or (with neither) Fan Hub followers.
function people(line: SponsorPlanLine): string | null {
  if (line.reachBasis === "STUDENTS" && line.studentCount !== null) return `${count(line.studentCount)} students`;
  if (line.reachBasis === "ROSTER" && line.rosterCount !== null) return `${count(line.rosterCount)} rostered players`;
  if (line.reachBasis === "FAN_HUB_FOLLOWERS") return `${count(line.fanReach)} Fan Hub followers`;
  return null;
}

// The row's short numbers: "2,326 students · 3,489 reached · 4.2% of budget · $0.60 per person".
export function lineStats(line: SponsorPlanLine): string[] {
  const who = people(line);
  return [
    ...(who ? [who] : []),
    line.projectedReach ? `${count(line.projectedReach)} reached` : "No reach on record",
    `${line.shareOfBudget.toLocaleString("en-US", { maximumFractionDigits: 1 })}% of budget`,
    ...(line.costPerReachCents !== null ? [`${dollars(line.costPerReachCents)} per person`] : []),
  ];
}

// The detail has something to show.
export const hasDetail = (line: SponsorPlanLine) => line.facts.length > 0 || line.nearLocations.length > 0;

interface LineDetailProps {
  id: string;
  line: SponsorPlanLine;
  // The plan's radius around each store.
  radiusMiles: number;
}

// "Why this organization": the server's facts as bullets, and the nearest of the sponsor's stores (none for an
// event the sponsor picked).
export default function LineDetail({ id, line, radiusMiles }: LineDetailProps) {
  const nearest = line.nearLocations[0];
  return (
    <div
      id={id}
      className="col-span-full rounded-[10px] border border-[#262626] bg-[#141414] p-4 grid gap-5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
    >
      {line.facts.length > 0 && (
        <div className="min-w-0">
          <div className={EYEBROW}>WHY THIS ORGANIZATION</div>
          <ul className="mt-2 flex flex-col gap-[6px] list-disc pl-5 text-[14px] text-[#d4d4d4] leading-[1.45]">
            {line.facts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
        </div>
      )}
      {nearest && (
        <div className="min-w-0">
          <div className={EYEBROW}>NEAREST STORE</div>
          <div className="mt-2 flex gap-2 items-start">
            <MapPin className="size-4 mt-[3px] shrink-0 text-[#c9b8ff]" strokeWidth={2} aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-white break-words">
                {`${nearest.name || "Your store"} · ${miles(nearest.distanceMiles)}`}
              </div>
              {formatAddress(nearest) && (
                <div className="text-[13px] text-[#a8a8a8] leading-[1.4] break-words">{formatAddress(nearest)}</div>
              )}
              <div className="text-[13px] text-[#a8a8a8] mt-1">
                {`${line.nearLocationCount} of your ${line.nearLocationCount === 1 ? "stores is" : "stores are"} within ${plural(
                  radiusMiles,
                  "mile"
                )}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
