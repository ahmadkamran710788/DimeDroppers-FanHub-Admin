import * as yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js";

// Limits and messages follow the sponsor profile API, which checks the same again.

// The Account card: the person who manages sponsorships.
export const accountSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Your full name is required")
    .max(120, "Keep your name under 120 characters"),
  // Optional: only checked once something is typed.
  phone: yup
    .string()
    .test("us-phone", "Enter a valid US phone number", (v) => !v || isValidPhoneNumber(v, "US")),
});

// A location needs something to place it on the map: a street, a city with a state, or a ZIP code.
export const locationSchema = yup
  .object({
    name: yup.string().trim().max(120, "Keep the location name under 120 characters"),
    street: yup.string().trim().max(300, "Keep the street address under 300 characters"),
    city: yup.string().trim().max(120, "Keep the city under 120 characters"),
    state: yup.string(),
    zip: yup
      .string()
      .trim()
      .test("zip", "Enter a 5-digit ZIP code", (v) => !v || /^\d{5}(-\d{4})?$/.test(v)),
  })
  .test("placeable", function (v) {
    const placeable = Boolean(v.street?.trim() || v.zip?.trim() || (v.city?.trim() && v.state));
    return placeable || this.createError({ path: "street", message: "Add a street address, a city and state, or a ZIP code" });
  });
