import * as yup from "yup";
import { MAX_NAME_LENGTH, MAX_SIZE_LENGTH, MAX_SLOT_VALUE } from "@/components/organization/inventory/data";

const VALUE_MESSAGE = `Whole dollars from $0 to $${MAX_SLOT_VALUE.toLocaleString("en-US")}`;

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

// The Add Exclusivity form: a name as well.
export const exclusivitySchema = customSlotSchema.shape({
  name: yup.string().trim().required("Enter a name").max(MAX_NAME_LENGTH, `At most ${MAX_NAME_LENGTH} characters`),
});
