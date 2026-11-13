import type { FieldError } from "@/components/sponsor/sponsor-api";

// The steps of the sign-up flow; step 4 is the "all set" screen after them.
export const STEPS = ["Account", "Brand", "Review"] as const;
export const DONE_STEP = STEPS.length + 1;

// The brand panel beside the form: the Dime Sponsors pitch and what it promises a new sponsor.
export const BRAND_PANEL = {
  mark: { src: "/DSLogoMark.svg", width: 44, height: 44 },
  name: "DIME SPONSORS",
  title: "Put your brand where the home team plays",
  text: "Find local organizations, buy sponsorship packages built around their game days, and fund the things their teams need.",
  perks: [
    "Packages for Predictions, Voting, Watch Live and more",
    "Banners and on-site space from the organization",
    "Dime AI campaign planning for national brands",
  ],
  already: "Already a sponsor?",
};

export interface SponsorSignUpForm {
  contact: string;
  email: string;
  password: string;
  phone: string;
  name: string;
  // A category code, Google's business type (googleCategory), or OTHER_CATEGORY with the text in categoryOther.
  category: string;
  categoryOther: string;
  // Google's business type for the place picked as the main location ("" for a plain address): the first
  // choice for the category, offered above the list.
  googleCategory: string;
  // The main location (headquarters or main branch), from the map picker or typed: Fetch locations searches
  // from it. The state is a two-letter code; the pin is text, e.g. "30.3058" and "-97.7516".
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude: string;
  longitude: string;
}

export const INITIAL_FORM: SponsorSignUpForm = {
  contact: "",
  email: "",
  password: "",
  phone: "",
  name: "",
  category: "",
  categoryOther: "",
  googleCategory: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  latitude: "",
  longitude: "",
};

// The main location's fields, which the map picker fills together.
export type MainLocationField = "street" | "city" | "state" | "zip" | "latitude" | "longitude";

// The sign-up API's field names → the wizard's field and the step that holds it.
const FIELD_STEPS: Record<string, { field: string; step: number }> = {
  name: { field: "contact", step: 1 },
  email: { field: "email", step: 1 },
  password: { field: "password", step: 1 },
  phone: { field: "phone", step: 1 },
  sponsorType: { field: "sponsorType", step: 2 },
  sponsorName: { field: "name", step: 2 },
  category: { field: "category", step: 2 },
  address: { field: "street", step: 2 },
  city: { field: "city", step: 2 },
  state: { field: "state", step: 2 },
  zipCode: { field: "zip", step: 2 },
  // Both shown under the map.
  latitude: { field: "latitude", step: 2 },
  longitude: { field: "latitude", step: 2 },
  acceptTerms: { field: "acceptTerms", step: 3 },
};

export interface SignUpProblem {
  step: number;
  errors: Record<string, string>;
}

// Errors only come back on Finish, so a failed sign-up goes back to the step that holds the failing field,
// with the message under it; null when it belongs to no field (429, 500…) and is shown as a toast.
// A taken email (409) comes without a `path`.
export function placeSignUpError(status: number, message: string, errors: FieldError[]): SignUpProblem | null {
  if (status === 409) return { step: 1, errors: { email: message } };
  const placed = errors.flatMap((e) => (FIELD_STEPS[e.path] ? [{ ...FIELD_STEPS[e.path], message: e.message }] : []));
  if (!placed.length) return null;
  const step = Math.min(...placed.map((p) => p.step));
  const fields: Record<string, string> = {};
  // The first message for a field wins (a short password is reported twice).
  for (const p of placed) if (p.step === step && !fields[p.field]) fields[p.field] = p.message;
  return { step, errors: fields };
}
