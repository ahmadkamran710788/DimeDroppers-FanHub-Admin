import { parsePhoneNumber } from "libphonenumber-js";
import type { ScorekeeperPoolMember } from "@/utils/types/scorekeeper";

// Phones are stored in E.164 ("+14155555013"); the masked PhoneInput shows the 10 national digits
// ("4155555013"). Both fall back to the raw value when it can't be parsed.
export const toNationalDigits = (e164: string | null) => {
  if (!e164) return "";
  try {
    return String(parsePhoneNumber(e164, "US").nationalNumber);
  } catch {
    return e164;
  }
};

export const toE164Phone = (phone: string) => {
  try {
    return parsePhoneNumber(phone, "US").number;
  } catch {
    return phone;
  }
};

// "+15125550100" → "(512) 555-0100" for reading.
export const formatPhone = (phone: string) => {
  try {
    return parsePhoneNumber(phone, "US").formatNational();
  } catch {
    return phone;
  }
};

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

// Select options whose label is also the value.
export const toOptions = (labels: string[]) => labels.map((label) => ({ label, value: label }));

// File size in the largest whole unit (840 KB / 1.2 MB).
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
};

// Dollar amount typed by a user ("$60,000" → 60000); NaN when it isn't a number.
export const parseMoney = (text: string): number => {
  const digits = text.replace(/[$,\s]/g, "");
  return digits ? Number(digits) : NaN;
};
