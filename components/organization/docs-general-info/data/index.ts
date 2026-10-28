// SAMPLE DATA — there is no documents endpoint yet. Mirrors what fans see on the event's Documents tab
// in the Fan Hub app; replace with API calls once the backend serves them.

export const TABS = ["Documents", "General Info"] as const;
export type DocsTab = (typeof TABS)[number];

export interface EventDocument {
  id: string;
  name: string;
  // When it was uploaded, shown under the name.
  uploadedAt: string;
  // The PDF to show in the popup; the sample documents have none.
  url?: string;
}

export const SAMPLE_DOCUMENTS: EventDocument[] = [
  { id: "doc-1", name: "Entry Packet", uploadedAt: "2026-07-11T18:14:00" },
  { id: "doc-2", name: "Athlete Waiver", uploadedAt: "2026-07-11T18:14:00" },
  { id: "doc-3", name: "Coaches Waiver", uploadedAt: "2026-07-11T18:14:00" },
];

// "7/11/2026 6:14 PM", as in the app.
export const formatStamp = (iso: string) =>
  new Date(iso)
    .toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    .replace(",", "");
