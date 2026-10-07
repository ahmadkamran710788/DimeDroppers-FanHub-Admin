"use client";

import Image from "next/image";
import toast from "react-hot-toast";
import GenericTable, { type Column } from "@/components/common/generic-table";
import RowActionsMenu from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import {
  CAMPAIGN_STATUS_COLOR,
  CAMPAIGN_TYPE_COLOR,
  type FundraisingCampaign,
} from "@/components/fundraising/data";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";

// Campaign actions need the fundraising API, which doesn't exist yet.
const comingSoon = () => toast("Coming soon.");

const formatEndDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const columns: Column<FundraisingCampaign>[] = [
  {
    header: "Campaign",
    cls: "flex-1 min-w-[320px] py-4",
    cell: (c) => (
      <div className="flex items-start gap-2 min-w-0">
        <Image src={c.image} alt="" width={112} height={112} className="size-28 shrink-0 rounded-lg object-cover" />
        <div className="flex flex-col gap-1 min-w-0 text-xs text-white">
          <span className="font-semibold leading-4.5">{c.title}</span>
          <span className="font-normal leading-4.75 opacity-40 line-clamp-3">{c.description}</span>
        </div>
      </div>
    ),
  },
  {
    header: "Type",
    cls: "w-[82px] shrink-0 py-4",
    cell: (c) => (
      <span className={cn("inline-flex h-6 px-2 rounded-full items-center text-xs font-medium text-white", CAMPAIGN_TYPE_COLOR[c.type])}>
        {c.type}
      </span>
    ),
  },
  { header: "Goal", cls: "w-[77px] shrink-0 py-4", cell: (c) => formatMoney(c.goal) },
  { header: "Raised", cls: "w-[85px] shrink-0 py-4", cell: (c) => formatMoney(c.raised) },
  {
    header: "Progress",
    cls: "w-[137px] shrink-0 py-4",
    cell: (c) => {
      const percent = c.goal > 0 ? Math.min(100, (c.raised / c.goal) * 100) : 0;
      return (
        <div
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full h-2 rounded-full bg-black/40"
        >
          <div className="h-2 rounded-full bg-steel-blue" style={{ width: `${percent}%` }} />
        </div>
      );
    },
  },
  {
    header: "Status",
    cls: "w-[70px] shrink-0 py-4",
    cell: (c) => <StatusPill label={c.status} color={CAMPAIGN_STATUS_COLOR[c.status]} className="px-2" />,
  },
  {
    header: "End Date",
    cls: "w-[100px] shrink-0 py-4",
    cell: (c) => (
      <div className="flex flex-col leading-4">
        <span>{formatEndDate(c.endDate)}</span>
        <span>({c.daysLeft} {c.daysLeft === 1 ? "Day" : "Days"} Left)</span>
      </div>
    ),
  },
  {
    header: "Actions",
    cls: "w-[73px] shrink-0 py-4 justify-end",
    cell: (c) => (
      <RowActionsMenu
        ariaLabel={`Actions for ${c.title}`}
        className="bg-white/25 hover:bg-white/35"
        items={[
          { label: "View Campaign", onSelect: comingSoon },
          { label: "Edit Campaign", onSelect: comingSoon },
          { label: "End Campaign", onSelect: comingSoon, variant: "destructive" },
        ]}
      />
    ),
  },
];

// A team's fundraising campaigns, laid out like the Figma Campaigns table.
export default function CampaignsTable({ campaigns }: { campaigns: FundraisingCampaign[] }) {
  return (
    <GenericTable
      columns={columns}
      rows={campaigns}
      getKey={(c) => c.id}
      empty="This team has no campaigns yet."
    />
  );
}
