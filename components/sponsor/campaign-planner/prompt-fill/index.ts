import { ALL } from "@/components/common/multi-select";
import { fieldOfPath, type PlanForm } from "@/components/sponsor/campaign-planner/data";
import type { SponsorStore } from "@/components/sponsor/find-organizations/use-sponsor-stores";
import type { FilterOption, SponsorSearchFilters } from "@/utils/types/sponsor-packages";
import type { SponsorPlanPromptResult } from "@/utils/types/sponsor-plan";

// What a brief (POST /plans/prompt) put in the composer.
export interface PromptFill {
  form: PlanForm;
  // The fields that came from the brief (highlighted until the sponsor edits them).
  filled: Set<keyof PlanForm>;
  // The fields the sponsor still has to fill before building.
  missing: Set<keyof PlanForm>;
  // Lines shown over the form.
  notes: string[];
}

// Shown under a field the brief left for the sponsor.
export const MISSING_MESSAGES: Partial<Record<keyof PlanForm, string>> = {
  stores: "Choose at least one of your locations, or all of them",
  budget: "Enter a budget",
};

// The API's field names → the composer's.
const fieldsOf = (paths: readonly string[]) =>
  new Set(paths.map(fieldOfPath).filter((f): f is keyof PlanForm => f !== null));

// The codes the composer offers (chips, seasons); every code while the filters haven't loaded.
const offered = (codes: string[], options: FilterOption[] | undefined) =>
  options ? codes.filter((code) => options.some((o) => o.code === code)) : codes;

// Dollars as the budget field keeps them, the number only ("30000", "30000.50").
const budgetText = (cents: number) => (cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100));

// The composer as the brief filled it. `form` is the body for POST /plans/recommend; what the composer can't
// show is dropped (stores with no map point aren't in the picker, nor sports, genders or seasons /filters doesn't
// offer), and a field left with nothing is no longer counted as filled.
export function fillFromPrompt(
  result: SponsorPlanPromptResult,
  stores: SponsorStore[] | null,
  filters: SponsorSearchFilters | null
): PromptFill {
  const { form: brief } = result;
  const storeIds = stores && new Set(stores.map((s) => s.id));
  const picked = Array.isArray(brief.brandLocationIds)
    ? brief.brandLocationIds.filter((id) => !storeIds || storeIds.has(id))
    : [];
  const season = brief.season && offered([brief.season], filters?.seasons).length ? brief.season : "";
  const sports = offered(brief.sports, filters?.sports);
  const genders = offered(brief.genders, filters?.genders);

  const form: PlanForm = {
    stores: brief.brandLocationIds === "ALL" ? ALL : picked,
    radius: String(brief.radiusMiles),
    budget: brief.budgetCents === null ? "" : budgetText(brief.budgetCents),
    season,
    goal: brief.goal,
    sports,
    genders,
  };

  const missing = fieldsOf(result.missing);
  if (form.stores !== ALL && !picked.length) missing.add("stores");
  if (!form.budget) missing.add("budget");

  const filled = fieldsOf(result.filled);
  for (const field of missing) filled.delete(field);
  if (!season) filled.delete("season");
  if (!sports.length) filled.delete("sports");
  if (!genders.length) filled.delete("genders");

  // Where the stores came from ("Texas (6), Oklahoma (1)"); areas with none are in the API's notes.
  const areas = result.areas.filter((a) => a.locationCount > 0).map((a) => `${a.label} (${a.locationCount})`);
  const notes = [...(areas.length ? [`Locations from your brief: ${areas.join(", ")}`] : []), ...result.notes];

  return { form, filled, missing, notes };
}
