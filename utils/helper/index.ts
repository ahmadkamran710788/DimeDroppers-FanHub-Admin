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

// "1 need" / "3 needs" (for words that take an "s").
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// A calendar date as yyyy-mm-dd in local time (not UTC, which can be a day off).
export const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// yyyy-mm-dd (or a full ISO timestamp's date part) as "Oct 4, 2026", read as a calendar date so no
// timezone moves it a day.
export const formatShortDate = (iso: string): string => {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// A moment (a full ISO timestamp, e.g. a need's endsAt or a payment's paidAt) as "Dec 13, 2026" in the
// viewer's time zone. Unlike formatShortDate, it doesn't take the UTC date part: 2026-12-14T04:59Z is still
// Dec 13 in Florida.
export const formatInstantDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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

// What a "$" field keeps of a keystroke or paste: digits with up to 2 decimals ("$60,000" → "60000"); null
// when it isn't an amount, so the change is dropped.
export const typedMoney = (text: string): string | null => {
  const amount = text.replace(/[^\d.]/g, "");
  return /^\d*(\.\d{0,2})?$/.test(amount) ? amount : null;
};

// A coordinate as a form shows it: 6 decimals (about 10 cm), so 45.66981699999999 reads 45.669817; "" for none.
export const coordinateText = (n: number | null) => (n === null ? "" : String(Number(n.toFixed(6))));

// A gender worth showing: none when it's missing or Exposure's "unspecified" placeholder.
export const knownGender = (gender: string | null | undefined) =>
  gender && gender.trim().toLowerCase() !== "unspecified" ? gender : undefined;
