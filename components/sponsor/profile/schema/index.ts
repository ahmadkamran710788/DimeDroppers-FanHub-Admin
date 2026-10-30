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

// A decimal degree no further from 0 than `max`, e.g. "-122.663238"; empty is not given.
const isCoordinate = (max: number) => (v: string | undefined) =>
  !v || (/^-?\d+(\.\d+)?$/.test(v) && Math.abs(Number(v)) <= max);

// A location needs something to place it on the map: a street, a city with a state, a ZIP code, or a pin
// (latitude and longitude together).
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
    latitude: yup.string().trim().test("latitude", "Enter a latitude between -90 and 90", isCoordinate(90)),
    longitude: yup.string().trim().test("longitude", "Enter a longitude between -180 and 180", isCoordinate(180)),
  })
  .test("together", function (v) {
    const latitude = Boolean(v.latitude?.trim());
    const longitude = Boolean(v.longitude?.trim());
    if (latitude === longitude) return true;
    return this.createError({ path: latitude ? "longitude" : "latitude", message: "Enter both latitude and longitude" });
  })
  .test("placeable", function (v) {
    const placeable = Boolean(
      v.street?.trim() ||
        v.zip?.trim() ||
        (v.city?.trim() && v.state) ||
        (v.latitude?.trim() && v.longitude?.trim())
    );
    return (
      placeable ||
      this.createError({ path: "street", message: "Add a street address, a city and state, a ZIP code, or latitude and longitude" })
    );
  });
