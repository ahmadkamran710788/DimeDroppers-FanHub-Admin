import * as yup from "yup";

// A new sponsor location.
export const locationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Location name is required")
    .max(80, "Keep the location name under 80 characters"),
  street: yup.string().trim().required("Street address is required"),
  city: yup.string().trim().required("City is required"),
  state: yup.string().required("Choose a state"),
  zip: yup
    .string()
    .trim()
    .required("ZIP code is required")
    .matches(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code"),
});
