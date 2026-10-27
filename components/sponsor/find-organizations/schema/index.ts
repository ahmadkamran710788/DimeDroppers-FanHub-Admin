import * as yup from "yup";

// The search filters: everything is optional (no location means any distance, no chip means any).
// A location the API can't geocode answers 400 with its own message.
export const orgSearchSchema = yup.object({
  name: yup.string().trim().max(120, "At most 120 characters"),
  location: yup
    .string()
    .trim()
    .test("length", "Enter at least 2 characters", (v) => !v || v.length >= 2)
    .max(200, "At most 200 characters"),
  // Optional: without a location it needs the sponsor's position; with one, the API's default applies.
  radius: yup.string(),
});
