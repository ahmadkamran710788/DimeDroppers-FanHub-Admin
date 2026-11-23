import { ALL, type MultiSelectValue } from "@/components/common/multi-select";
import { STATE_OPTIONS } from "@/components/sponsor/profile/data";
import type { SponsorStore } from "@/components/sponsor/find-organizations/use-sponsor-stores";
import type { SplitRow } from "@/components/sponsor/campaign-planner/data";
import type { SponsorPlanAllocation } from "@/utils/types/sponsor-plan";

// The budget split (FANHUB_SPONSOR_PLAN_CHANGES_21_NOV_FRONTEND.md §3). A row is a whole state or a city, and the
// API refuses a row none of the chosen stores are in, so the rows offer only the chosen stores' states and
// cities, spelled as the stores spell them (a store goes to its city's row, else to its state's row).

// A state the chosen stores are in, and their cities there (A–Z).
export interface SplitArea {
  // Two-letter code ("NC").
  state: string;
  // "North Carolina".
  label: string;
  cities: string[];
}

// "North Carolina" for "NC"; the code itself when it isn't a US state.
export const stateName = (code: string) => STATE_OPTIONS.find((o) => o.value === code)?.label ?? code;

// A store's state as a two-letter code ("NC", or "North Carolina" written out); null when it isn't a US state.
function stateCode(state: string | null): string | null {
  if (!state) return null;
  const text = state.toUpperCase();
  return STATE_OPTIONS.find((o) => o.value === text || o.label.toUpperCase() === text)?.value ?? null;
}

const sameCity = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// The states and cities of the stores the plan is around (every store, or the picked ones), states A–Z.
export function splitAreas(stores: SponsorStore[] | null, picked: MultiSelectValue): SplitArea[] {
  const byState = new Map<string, string[]>();
  for (const store of stores ?? []) {
    if (picked !== ALL && !picked.includes(store.id)) continue;
    const state = stateCode(store.state);
    if (!state) continue;
    const cities = byState.get(state) ?? [];
    if (store.city && !cities.some((c) => sameCity(c, store.city!))) cities.push(store.city);
    byState.set(state, cities);
  }
  return [...byState.entries()]
    .map(([state, cities]) => ({ state, label: stateName(state), cities: cities.sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// "Morrisville, NC" or "North Carolina", as the API names a row.
export const rowLabel = (row: Pick<SplitRow, "state" | "city">) =>
  row.city ? `${row.city}, ${row.state}` : stateName(row.state);

// The rows' percents added up.
export const splitTotal = (rows: SplitRow[]) => rows.reduce((sum, row) => sum + (Number(row.percent) || 0), 0);

let lastRowId = 0;
export const splitRowId = () => `split-${++lastRowId}`;

// A new row: the only state when the stores are in one, and what's left of 100%.
export function newSplitRow(rows: SplitRow[], areas: SplitArea[]): SplitRow {
  const left = 100 - splitTotal(rows);
  return {
    id: splitRowId(),
    state: areas.length === 1 ? areas[0].state : "",
    city: "",
    percent: left > 0 ? String(left) : "",
  };
}

// The body's `allocations`.
export const toAllocations = (rows: SplitRow[]): SponsorPlanAllocation[] =>
  rows.map((row) => ({ state: row.state, city: row.city || null, percent: Number(row.percent) }));

// The API's split (a brief's) as rows, with each city spelled as the chosen stores spell it.
export function fromAllocations(allocations: SponsorPlanAllocation[], areas: SplitArea[]): SplitRow[] {
  return allocations.map((a) => {
    const state = a.state.toUpperCase();
    const city = a.city ?? "";
    const stored = areas.find((area) => area.state === state)?.cities.find((c) => sameCity(c, city));
    return { id: splitRowId(), state, city: stored ?? city, percent: String(a.percent) };
  });
}

// What's wrong with the split, in the API's own words (its 400 messages), or null. No rows is no split.
export function splitProblem(rows: SplitRow[], areas: SplitArea[]): string | null {
  if (!rows.length) return null;
  if (rows.some((row) => !stateCode(row.state))) return "Choose a US state for each row of the budget split";
  if (rows.some((row) => !(Number(row.percent) >= 1 && Number(row.percent) <= 100)))
    return "Enter a percent from 1 to 100 for each row of the budget split";
  const keys = rows.map((row) => `${row.state}|${row.city.toLowerCase()}`);
  if (new Set(keys).size !== keys.length) return "Each state or city can appear only once in the budget split";
  if (splitTotal(rows) !== 100) return "The budget split must add up to 100%";
  const empty = rows.find((row) => {
    const area = areas.find((a) => a.state === row.state);
    return !area || (row.city && !area.cities.some((c) => sameCity(c, row.city)));
  });
  return empty ? `None of the chosen locations are in ${rowLabel(empty)}` : null;
}
