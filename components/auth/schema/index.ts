import * as yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js";

export const signInSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup.string().required("Password is required"),
});

export const signUpSchema = yup.object({
  name: yup.string().required("Organization name is required"),
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  phone: yup
    .string()
    .required("Phone is required")
    .test("us-phone", "Enter a valid US phone number", (v) => !!v && isValidPhoneNumber(v, "US")),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

// Sponsor sign-up, step 1: the person who manages sponsorships. Limits and messages follow the sponsor
// sign-up API, which checks the same again.
const SPONSOR_PASSWORD_RULE = "Use 8 or more characters with a number";

export const sponsorAccountSchema = yup.object({
  contact: yup
    .string()
    .trim()
    .required("Your full name is required")
    .max(120, "Keep your name under 120 characters"),
  email: yup
    .string()
    .trim()
    .required("Work email is required")
    .email("Enter a valid email address")
    .max(254, "Keep the email under 254 characters"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, SPONSOR_PASSWORD_RULE)
    .max(128, "Keep the password under 128 characters")
    .matches(/\d/, SPONSOR_PASSWORD_RULE),
  // Optional: only checked once something is typed.
  phone: yup
    .string()
    .test("us-phone", "Enter a valid US phone number", (v) => !v || isValidPhoneNumber(v, "US")),
});

// Sponsor sign-up, step 2: the brand organizations see. Also the Sponsor details form on the profile.
export const sponsorBrandSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Sponsor name is required")
    .max(120, "Keep the sponsor name under 120 characters"),
  category: yup.string().required("Choose a category"),
});

// A decimal degree no further from 0 than `max`, e.g. "-97.7516".
const isDegree = (max: number) => (v: string | undefined) =>
  !!v && /^-?\d+(\.\d+)?$/.test(v.trim()) && Math.abs(Number(v)) <= max;

// Sponsor sign-up, step 2: the main location, which Fetch locations searches from. The pin comes from the map
// (or is typed); the API saves it as sent, without looking the address up.
export const sponsorMainLocationSchema = yup.object({
  street: yup.string().trim().required("Address is required").max(300, "Keep the address under 300 characters"),
  city: yup.string().trim().required("City is required").max(120, "Keep the city under 120 characters"),
  state: yup.string().required("Choose a US state"),
  zip: yup.string().trim().max(20, "Keep the ZIP code under 20 characters"),
  latitude: yup
    .string()
    .required("Pick your location on the map")
    .test("latitude", "Enter a latitude between -90 and 90", isDegree(90)),
  longitude: yup
    .string()
    .required("Pick your location on the map")
    .test("longitude", "Enter a longitude between -180 and 180", isDegree(180)),
});
