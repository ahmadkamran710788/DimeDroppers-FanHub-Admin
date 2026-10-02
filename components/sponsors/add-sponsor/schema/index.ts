import * as yup from "yup";

// No industry list from the backend yet — a fixed set until the sponsors API defines one.
export const INDUSTRY_OPTIONS = [
  "Apparel",
  "Automotive",
  "Banking & Finance",
  "Food & Beverage",
  "Healthcare",
  "Insurance",
  "Real Estate",
  "Restaurant",
  "Retail",
  "Technology",
  "Other",
].map((v) => ({ label: v, value: v }));

export const COUNTRY_OPTIONS = ["United States", "Canada"].map((v) => ({ label: v, value: v }));

export const addSponsorSchema = yup.object({
  name: yup.string().trim().required("Sponsor / company name is required"),
  industry: yup.string().required("Select a business type"),
  address1: yup.string().trim(),
  address2: yup.string().trim(),
  country: yup.string(),
  city: yup.string().trim(),
  state: yup.string().trim().max(2, "Use the 2-letter state code"),
  zip: yup
    .string()
    .trim()
    .matches(/^(\d{5}(-\d{4})?)?$/, "Enter a valid ZIP code"),
  contactName: yup.string().trim(),
  jobTitle: yup.string().trim(),
  email: yup.string().trim().email("Enter a valid email address"),
  phone: yup
    .string()
    .test("is-complete", "Enter a 10-digit phone number", (v) => !v || v.replace(/\D/g, "").length === 10),
  website: yup.string().trim().url("Enter a full URL, e.g. https://www.nike.com"),
});
