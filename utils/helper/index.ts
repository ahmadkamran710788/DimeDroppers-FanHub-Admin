import type { ScorekeeperPoolMember } from "@/utils/types/scorekeeper";

// A pool row reaches us two ways with differing shapes: org-invited (top-level `email`,
// no `fan`) or fan-requested (nested `fan`, no top-level `email`). These normalize the
// two shapes into a single display value.

export const getScorekeeperName = (m: ScorekeeperPoolMember): string =>
  m.fan?.name?.trim() || m.fan?.email?.trim() || m.email?.trim() || "Unknown";

export const getScorekeeperEmail = (m: ScorekeeperPoolMember): string =>
  m.fan?.email?.trim() || m.email?.trim() || "";

// US-dollar amount; cents are shown only when the value has them ($25,000 / $9,425.53).
export const formatMoney = (amount: number): string =>
  amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
