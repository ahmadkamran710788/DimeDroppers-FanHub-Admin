import * as yup from "yup";
import { MAX_SIZE_LENGTH, MAX_SLOT_VALUE } from "@/components/organization/activations/data";

const VALUE_MESSAGE = `Whole dollars from $0 to $${MAX_SLOT_VALUE.toLocaleString("en-US")}`;

// An Exclusivity slot's value and size, typed as text. Empty means the default (the category base
// value, the catalog size).
export const exclusivitySlotSchema = yup.object({
  value: yup
    .string()
    .trim()
    .test("whole", VALUE_MESSAGE, (v) => !v || /^\d+$/.test(v))
    .test("range", VALUE_MESSAGE, (v) => !v || Number(v) <= MAX_SLOT_VALUE),
  size: yup.string().trim().max(MAX_SIZE_LENGTH, `At most ${MAX_SIZE_LENGTH} characters`),
});
