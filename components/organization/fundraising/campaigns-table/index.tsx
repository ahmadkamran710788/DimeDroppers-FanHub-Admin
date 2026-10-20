"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/common/confirm-modal";
import GenericTable, { type Column } from "@/components/common/generic-table";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import {
  CAMPAIGN_STATUS_COLOR,
  campaignStatusLabel,
  isCampaignEditable,
} from "@/components/organization/fundraising/campaign-status";
import apiCall from "@/utils/api-call";
import { formatMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";
import type { Campaign } from "@/utils/types/campaign";

type ConfirmKind = "launch" | "end" | "delete";

const CONFIRM: Record<
  ConfirmKind,
  { title: string; confirmLabel: string; busyLabel: string; destructive: boolean; message: (c: Campaign) => string }
> = {
  launch: {
    title: "Launch Campaign",
    confirmLabel: "Launch",
    busyLabel: "Launching…",
    destructive: false,
    message: (c) => `"${c.title}" goes live in the Fan Hub app and every fan following the school gets a "New fundraiser" notification.`,
  },
  end: {
    title: "End Campaign",
    confirmLabel: "End Campaign",
    busyLabel: "Ending…",
    destructive: true,
    message: (c) => `"${c.title}" stops taking donations. Fans can still see it, and you can reopen it later.`,
  },
  delete: {
    title: "Delete Campaign",
    confirmLabel: "Delete",
    busyLabel: "Deleting…",
    destructive: true,
    message: (c) =>
      c.status === "DRAFT"
        ? `The draft "${c.title}" will be deleted for good.`
        : `"${c.title}" will be cancelled and hidden from fans. Its donation history is kept.`,
  },
};

const formatEndDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const isPastEndDate = (c: Campaign) => new Date(c.endDate).getTime() <= Date.now();

interface CampaignsTableProps {
  campaigns: Campaign[];
  // Refetches the campaigns (and stats) after an action changed one.
  onChanged: () => void;
  // Adds a Team column (the all-campaigns list; a team's own list doesn't need it).
  showTeam?: boolean;
  loading?: boolean;
  empty?: string;
}

// Fundraising campaigns with Edit / Launch / End / Reopen / Delete on each row.
export default function CampaignsTable({
  campaigns,
  onChanged,
  showTeam = false,
  loading = false,
  empty = "This team has no campaigns yet.",
}: CampaignsTableProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; campaign: Campaign } | null>(null);

  // apiCall toasts failures (e.g. a campaign with donations cannot go back to draft) itself.
  const patchStatus = async (c: Campaign, status: "ACTIVE" | "ENDED", successMessage: string) => {
    const { success } = await apiCall({
      endpoint: routes.api.campaign(c.id),
      method: "PATCH",
      data: { status },
      invalidates: [routes.api.campaigns],
      showSuccessToast: true,
      successMessage,
    });
    if (success) onChanged();
    return success;
  };

  const runConfirm = async ({ kind, campaign: c }: { kind: ConfirmKind; campaign: Campaign }) => {
    if (kind === "launch") return patchStatus(c, "ACTIVE", "Campaign launched");
    if (kind === "end") return patchStatus(c, "ENDED", "Campaign ended");
    const { success } = await apiCall({
      endpoint: routes.api.campaign(c.id),
      method: "DELETE",
      invalidates: [routes.api.campaigns],
      showSuccessToast: true,
      successMessage: c.status === "DRAFT" ? "Draft deleted" : "Campaign cancelled",
    });
    if (success) onChanged();
    return success;
  };

  const actionsFor = (c: Campaign): RowAction[] => [
    { label: "Edit Campaign", onSelect: () => router.push(routes.ui.editFundraisingCampaign(c.id)) },
    ...(c.status === "DRAFT" ? [{ label: "Launch Campaign", onSelect: () => setConfirm({ kind: "launch", campaign: c }) }] : []),
    ...(c.status === "ACTIVE" ? [{ label: "End Campaign", onSelect: () => setConfirm({ kind: "end", campaign: c }) }] : []),
    // Reopening only makes sense while the end date is still ahead.
    ...(c.status === "ENDED" && !isPastEndDate(c)
      ? [{ label: "Reopen Campaign", onSelect: () => void patchStatus(c, "ACTIVE", "Campaign reopened") }]
      : []),
    {
      label: c.status === "DRAFT" ? "Delete Draft" : "Cancel Campaign",
      variant: "destructive",
      onSelect: () => setConfirm({ kind: "delete", campaign: c }),
    },
  ];

  const columns: Column<Campaign>[] = [
    {
      header: "Campaign",
      cls: "flex-1 min-w-[260px] py-4",
      cell: (c) => (
        <div className="flex flex-col gap-1 min-w-0 text-xs text-white">
          <span className="font-semibold leading-4.5">{c.title}</span>
          {c.description && <span className="font-normal leading-4.75 opacity-40 line-clamp-3">{c.description}</span>}
          {c.sponsorName && <span className="font-normal leading-4.75 opacity-60">{`Presented by ${c.sponsorName}`}</span>}
        </div>
      ),
    },
    ...(showTeam
      ? [{ header: "Team", cls: "w-40 shrink-0 py-4", cell: (c: Campaign) => <span className="leading-5">{c.team?.name ?? "—"}</span> }]
      : []),
    { header: "Goal", cls: "w-[85px] shrink-0 py-4", cell: (c) => formatMoney(c.goalAmount) },
    {
      header: "Raised",
      cls: "w-[95px] shrink-0 py-4",
      cell: (c) => (
        <div className="flex flex-col leading-4">
          <span>{formatMoney(c.currentAmount)}</span>
          <span className="text-white/40">{`${c.donationCount} ${c.donationCount === 1 ? "donation" : "donations"}`}</span>
        </div>
      ),
    },
    {
      header: "Progress",
      cls: "w-[137px] shrink-0 py-4",
      cell: (c) => {
        const percent = Math.min(100, c.progressPercent);
        return (
          <div className="w-full flex flex-col gap-1">
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full h-2 rounded-full bg-black/40"
            >
              <div className="h-2 rounded-full bg-steel-blue" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs text-white/60">{`${c.progressPercent}%`}</span>
          </div>
        );
      },
    },
    {
      header: "Status",
      cls: "w-[90px] shrink-0 py-4",
      cell: (c) => {
        const label = campaignStatusLabel(c);
        return <StatusPill label={label} color={CAMPAIGN_STATUS_COLOR[label]} className="px-2" />;
      },
    },
    {
      header: "End Date",
      cls: "w-[110px] shrink-0 py-4",
      cell: (c) => (
        <div className="flex flex-col leading-4">
          <span>{formatEndDate(c.endDate)}</span>
          {!c.isEnded && <span>{`(${c.daysLeft} ${c.daysLeft === 1 ? "Day" : "Days"} Left)`}</span>}
        </div>
      ),
    },
    {
      header: "Actions",
      cls: "w-[73px] shrink-0 py-4 justify-end",
      cell: (c) =>
        isCampaignEditable(c) ? (
          <RowActionsMenu ariaLabel={`Actions for ${c.title}`} className="bg-white/25 hover:bg-white/35" items={actionsFor(c)} />
        ) : (
          <span className="text-white/40">—</span>
        ),
    },
  ];

  const settings = confirm ? CONFIRM[confirm.kind] : null;

  return (
    <>
      <GenericTable columns={columns} rows={campaigns} getKey={(c) => c.id} loading={loading} empty={empty} />
      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={settings?.title ?? ""}
        message={confirm && settings ? settings.message(confirm.campaign) : ""}
        confirmLabel={settings?.confirmLabel ?? ""}
        busyLabel={settings?.busyLabel ?? ""}
        destructive={settings?.destructive}
        onConfirm={() => (confirm ? runConfirm(confirm) : Promise.resolve(false))}
      />
    </>
  );
}
