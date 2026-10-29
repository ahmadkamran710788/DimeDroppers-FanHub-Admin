import type { FieldError } from "@/components/sponsor/sponsor-api";

// The steps of the sign-up flow; step 4 is the "all set" screen after them.
export const STEPS = ["Account", "Brand", "Review"] as const;
export const DONE_STEP = STEPS.length + 1;

// What the brand panel promises a new sponsor.
export const BENEFITS = [
  "Packages for Predictions, Voting, Watch Live and more",
  "Banners and on-site space from the organization",
  "Dime AI campaign planning for national brands",
];

export interface SponsorSignUpForm {
  contact: string;
  email: string;
  password: string;
  phone: string;
  name: string;
  category: string;
}

export const INITIAL_FORM: SponsorSignUpForm = {
  contact: "",
  email: "",
  password: "",
  phone: "",
  name: "",
  category: "",
};

// The sign-up API's field names → the wizard's field and the step that holds it.
const FIELD_STEPS: Record<string, { field: string; step: number }> = {
  name: { field: "contact", step: 1 },
  email: { field: "email", step: 1 },
  password: { field: "password", step: 1 },
  phone: { field: "phone", step: 1 },
  sponsorType: { field: "sponsorType", step: 2 },
  sponsorName: { field: "name", step: 2 },
  category: { field: "category", step: 2 },
  logo: { field: "logo", step: 2 },
  acceptTerms: { field: "acceptTerms", step: 3 },
};

export interface SignUpProblem {
  step: number;
  errors: Record<string, string>;
}

// Errors only come back on Finish, so a failed sign-up goes back to the step that holds the failing field,
// with the message under it; null when it belongs to no field (429, 500…) and is shown as a toast.
// A taken email (409) and the logo checks come without a `path`.
export function placeSignUpError(status: number, message: string, errors: FieldError[]): SignUpProblem | null {
  if (status === 409) return { step: 1, errors: { email: message } };
  if (/^logo\b/i.test(message)) return { step: 2, errors: { logo: message } };
  const placed = errors.flatMap((e) => (FIELD_STEPS[e.path] ? [{ ...FIELD_STEPS[e.path], message: e.message }] : []));
  if (!placed.length) return null;
  const step = Math.min(...placed.map((p) => p.step));
  const fields: Record<string, string> = {};
  // The first message for a field wins (a short password is reported twice).
  for (const p of placed) if (p.step === step && !fields[p.field]) fields[p.field] = p.message;
  return { step, errors: fields };
}
