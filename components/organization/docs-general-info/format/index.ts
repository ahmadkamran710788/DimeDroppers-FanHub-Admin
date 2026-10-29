export const TABS = ["Notes", "General Info"] as const;
export type DocsTab = (typeof TABS)[number];

// "7/11/2026 6:14 PM", as in the app.
export const formatStamp = (iso: string) =>
  new Date(iso)
    .toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    .replace(",", "");
