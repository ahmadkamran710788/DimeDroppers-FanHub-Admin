import * as yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js";

// A decimal degree no further from 0 than `max`, e.g. "-97.7516".
const isDegree = (max: number) => (v: string | undefined) =>
  !!v && /^-?\d+(\.\d+)?$/.test(v.trim()) && Math.abs(Number(v)) <= max;

export const signInSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup.string().required("Password is required"),
});

// Organisation sign-up, one schema per step. Messages follow the design (docs/ui/Signin&signup-html); the
// API checks names, the email, the password length and the URLs again.
const REQUIRED = "This field is required.";
const CHOOSE = "Choose an option.";
const ORG_PASSWORD_RULE = "Use 8 or more characters with a number.";
const PHONE_RULE = "Enter a 10-digit phone number.";
const URL_RULE = "Start with https:// and include the full address.";
const HEX_RULE = "Use a hex color like #FD212C.";

// A full web address, as the API's URL fields expect ("example.com" alone is refused there too).
const optionalUrl = yup
  .string()
  .trim()
  .max(500, "Keep the address under 500 characters.")
  .test("url", URL_RULE, (v) => !v || /^https?:\/\/\S+\.\S+/.test(v));
const hexColor = yup.string().trim().matches(/^#[0-9a-fA-F]{6}$/, HEX_RULE);

// Step 1: the person who manages the organisation's Fan Hub.
export const orgAccountSchema = yup.object({
  fullName: yup.string().trim().required(REQUIRED).max(120, "Keep your name under 120 characters."),
  accountEmail: yup
    .string()
    .trim()
    .required(REQUIRED)
    .email("Enter a valid email address.")
    .max(254, "Keep the email under 254 characters."),
  password: yup
    .string()
    .required(REQUIRED)
    .min(8, ORG_PASSWORD_RULE)
    .max(128, "Keep the password under 128 characters.")
    .matches(/\d/, ORG_PASSWORD_RULE),
  // Optional: only checked once something is typed.
  accountPhone: yup.string().test("us-phone", PHONE_RULE, (v) => !v || isValidPhoneNumber(v, "US")),
});

// Step 2: the organisation, its team, sport and level.
export const orgDetailsSchema = yup.object({
  organizationName: yup.string().trim().required(REQUIRED).max(120, "Keep the name under 120 characters."),
  organizationType: yup.string().required(CHOOSE),
  eventType: yup.string().required(CHOOSE),
  teamName: yup.string().trim().required(REQUIRED).max(120, "Keep the team name under 120 characters."),
  sport: yup.string().required(CHOOSE),
  level: yup.string().required(CHOOSE),
  gender: yup.string().required(CHOOSE),
  description: yup.string().max(250, "Keep the description under 250 characters."),
});

// Step 3: where the games happen (the map pin, then the address) and who fans and sponsors can reach.
export const orgLocationSchema = yup.object({
  latitude: yup
    .string()
    .required("Find your address on the map, or drop the pin on it.")
    .test("latitude", "Enter a latitude between -90 and 90.", isDegree(90)),
  longitude: yup
    .string()
    .required("Find your address on the map, or drop the pin on it.")
    .test("longitude", "Enter a longitude between -180 and 180.", isDegree(180)),
  streetAddress: yup.string().trim().required(REQUIRED).max(300, "Keep the address under 300 characters."),
  city: yup.string().trim().required(REQUIRED).max(120, "Keep the city under 120 characters."),
  state: yup.string().required(CHOOSE),
  zipCode: yup.string().trim().required(REQUIRED).matches(/^\d{5}$/, "Enter a 5-digit zip code."),
  conference: yup.string().trim().max(120, "Keep it under 120 characters."),
  contactName: yup.string().trim().required(REQUIRED).max(120, "Keep the name under 120 characters."),
  contactPosition: yup.string().trim().required(REQUIRED).max(120, "Keep the position under 120 characters."),
  phone: yup.string().required(REQUIRED).test("us-phone", PHONE_RULE, (v) => !!v && isValidPhoneNumber(v, "US")),
  email: yup.string().trim().required(REQUIRED).email("Enter a valid email address."),
  website: optionalUrl,
});

// Step 4: branding and social links, all optional (the colours always hold a value).
export const orgBrandingSchema = yup.object({
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  xUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  tiktokUrl: optionalUrl,
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
