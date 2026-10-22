import * as yup from "yup";
import { MAX_SIZE_LENGTH, MAX_SLOT_VALUE } from "@/components/organization/inventory/data";

const VALUE_MESSAGE = `Whole dollars from $0 to $${MAX_SLOT_VALUE.toLocaleString("en-US")}`;

// The Custom Exclusivity slot's value and size, typed as text. Both are needed while it's switched on.
export const customSlotSchema = yup.object({
  value: yup
    .string()
    .trim()
    .required("Enter a value")
    .test("whole", VALUE_MESSAGE, (v) => !v || /^\d+$/.test(v))
    .test("range", VALUE_MESSAGE, (v) => !v || Number(v) <= MAX_SLOT_VALUE),
  size: yup.string().trim().required("Enter a size").max(MAX_SIZE_LENGTH, `At most ${MAX_SIZE_LENGTH} characters`),
});
