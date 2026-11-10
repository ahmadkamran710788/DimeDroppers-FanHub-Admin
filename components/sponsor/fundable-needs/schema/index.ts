import * as yup from "yup";
import { MIN_CONTRIBUTION_CENTS, NOTE_MAX, dollars } from "@/components/sponsor/fundable-needs/data";

// The Fund panel: an amount between the API's minimum and what the need still lacks, and an optional note.
export const fundSchema = (remainingCents: number) =>
  yup.object({
    amountCents: yup
      .number()
      .typeError("Enter an amount")
      .required("Enter an amount")
      .integer("Enter an amount in dollars and cents")
      .min(MIN_CONTRIBUTION_CENTS, `The minimum is ${dollars(MIN_CONTRIBUTION_CENTS)}`)
      .max(remainingCents, `This need only lacks ${dollars(remainingCents)}`),
    note: yup.string().max(NOTE_MAX, `Keep the note under ${NOTE_MAX.toLocaleString("en-US")} characters`),
  });
