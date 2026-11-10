import * as yup from "yup";
import { DESCRIPTION_MAX, TITLE_MAX, WHY_MAX } from "@/components/organization/fundable-needs/data";
import { dollars } from "@/utils/needs";
import type { NeedScope } from "@/utils/types/needs";

interface NeedSchemaOptions {
  // EVENT: a tournament picks an event; GAME: a school picks a game.
  scope: NeedScope;
  // Editing: only the name, the texts and the goal can change.
  editing: boolean;
  goalMinCents: number;
  goalMaxCents: number;
  // Editing: the goal can't go below what sponsors have already given.
  raisedCents?: number;
}

// Create / edit a need, with the API's rules. The keys match the API's field names, so a 400 from the
// backend lands on the same fields.
export const needSchema = ({ scope, editing, goalMinCents, goalMaxCents, raisedCents = 0 }: NeedSchemaOptions) => {
  const floor = Math.max(goalMinCents, raisedCents);
  return yup.object({
    categoryCode: editing ? yup.string() : yup.string().required("Choose what kind of need this is."),
    eventId:
      !editing && scope === "EVENT" ? yup.string().required("Choose the event this need is for.") : yup.string(),
    scheduleEventId:
      !editing && scope === "GAME" ? yup.string().required("Choose the game this need is for.") : yup.string(),
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
