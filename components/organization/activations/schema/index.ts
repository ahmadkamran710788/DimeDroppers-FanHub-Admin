import * as yup from "yup";
import { MAX_SLOT_VALUE } from "@/components/organization/activations/data";

const VALUE_MESSAGE = `Whole dollars from $0 to $${MAX_SLOT_VALUE.toLocaleString("en-US")}`;

// A ticked slot's value, typed as text: whole dollars, 0 – 1,000,000.
export const slotValueSchema = yup.object({
  value: yup
    .string()
    .trim()
    .required("Value is required")
    .matches(/^\d+$/, VALUE_MESSAGE)
    .test("range", VALUE_MESSAGE, (v) => Number(v) <= MAX_SLOT_VALUE),
});
