import * as yup from "yup";
import {
  MAX_NAME_LENGTH,
  MAX_SIZE_LENGTH,
  MAX_SLOT_VALUE,
  MAX_SPONSOR_SPOTS,
} from "@/components/organization/inventory/data";

const VALUE_MESSAGE = `Whole dollars from $0 to $${MAX_SLOT_VALUE.toLocaleString("en-US")}`;
const SPOTS_MESSAGE = `A whole number from 1 to ${MAX_SPONSOR_SPOTS}`;

// A physical asset's "Sponsor spots", typed as text: how many sponsors can buy it.
const maxSponsors = yup
  .string()
  .trim()
  .required("Enter how many sponsors can buy this asset")
  .test("whole", SPOTS_MESSAGE, (v) => !v || /^\d+$/.test(v))
  .test("range", SPOTS_MESSAGE, (v) => !v || (Number(v) >= 1 && Number(v) <= MAX_SPONSOR_SPOTS));

// Every physical asset's Sponsor spots (Dime's catalogue ones as well as the org's own).
export const spotsSchema = yup.object({ maxSponsors });

// An exclusivity's value and size, typed as text. Both are needed.
export const customSlotSchema = yup.object({
  value: yup
    .string()
    .trim()
    .required("Enter a value")
    .test("whole", VALUE_MESSAGE, (v) => !v || /^\d+$/.test(v))
    .test("range", VALUE_MESSAGE, (v) => !v || Number(v) <= MAX_SLOT_VALUE),
  size: yup.string().trim().required("Enter a size").max(MAX_SIZE_LENGTH, `At most ${MAX_SIZE_LENGTH} characters`),
});

// The Add Physical Asset form: a name, a category and its Sponsor spots as well (the API refuses a new asset
// without them).
export const exclusivitySchema = customSlotSchema.shape({
  name: yup.string().trim().required("Enter a name").max(MAX_NAME_LENGTH, `At most ${MAX_NAME_LENGTH} characters`),
  assetCategory: yup.string().required("Choose a category"),
  maxSponsors,
});
