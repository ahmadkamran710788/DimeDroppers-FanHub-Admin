import * as yup from "yup";
import { DESCRIPTION_MAX, TITLE_MAX, WHY_MAX } from "@/components/organization/fundable-needs/data";
import { dollars } from "@/utils/needs";
import type { NeedScope } from "@/utils/types/needs";

interface NeedSchemaOptions {
  // EVENT: a tournament picks an event; SCHOOL: a school picks the day its need ends.
  scope: NeedScope;
  // Editing: only the name, the texts and the goal can change.
  editing: boolean;
  goalMinCents: number;
  goalMaxCents: number;
  // A school's end-date limits (YYYY-MM-DD) from the options.
  endDateRange?: { min: string; max: string } | null;
  // Editing: the goal can't go below what sponsors have already given.
  raisedCents?: number;
}

// Create / edit a need, with the API's rules. The keys match the API's field names, so a 400 from the
// backend lands on the same fields.
export const needSchema = ({ scope, editing, goalMinCents, goalMaxCents, endDateRange, raisedCents = 0 }: NeedSchemaOptions) => {
  const floor = Math.max(goalMinCents, raisedCents);
  // YYYY-MM-DD strings sort as dates.
  const endDate = yup
    .string()
    .required("Choose the date this need ends.")
    .test("not-past", "The end date cannot be in the past.", (d) => !endDateRange || !d || d >= endDateRange.min)
    .test("not-too-far", "The end date can be at most 365 days from today.", (d) => !endDateRange || !d || d <= endDateRange.max);
  return yup.object({
    categoryCode: editing ? yup.string() : yup.string().required("Choose what kind of need this is."),
    eventId:
      !editing && scope === "EVENT" ? yup.string().required("Choose the event this need is for.") : yup.string(),
    endDate: !editing && scope === "SCHOOL" ? endDate : yup.string(),
    title: yup
      .string()
      .trim()
      .required("Give the need a name sponsors will understand.")
      .max(TITLE_MAX, `Keep the name to ${TITLE_MAX} characters.`),
    description: yup
      .string()
      .trim()
      .required("Say what this need pays for.")
      .max(DESCRIPTION_MAX, `Keep it to ${DESCRIPTION_MAX.toLocaleString("en-US")} characters.`),
    whyItMatters: yup.string().trim().max(WHY_MAX, `Keep it to ${WHY_MAX.toLocaleString("en-US")} characters.`),
    goalCents: yup
      .number()
      .typeError("Enter the goal amount.")
      .required("Enter the goal amount.")
      .min(
        floor,
        raisedCents > goalMinCents
          ? `The goal can't be lower than the ${dollars(raisedCents)} already raised.`
          : `The goal must be at least ${dollars(goalMinCents)}.`
      )
      .max(goalMaxCents, `The goal can be at most ${dollars(goalMaxCents)}.`),
  });
};
