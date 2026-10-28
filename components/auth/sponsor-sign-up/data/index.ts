// The steps of the sign-up flow; step 4 is the "all set" screen after them.
export const STEPS = ["Account", "Brand", "Review"] as const;
export const DONE_STEP = STEPS.length + 1;

// What the brand panel promises a new sponsor.
export const BENEFITS = [
  "Packages for Predictions, Voting, Watch Live and more",
  "Banners and on-site space from the organization",
  "Dime AI campaign planning for national brands",
];

export type SponsorType = "local" | "national";

export const SPONSOR_TYPES: { value: SponsorType; name: string; description: string }[] = [
  { value: "local", name: "Local business", description: "One or a few locations. Sponsor organizations in your area." },
  { value: "national", name: "National brand", description: "Many markets. Includes Dime AI to plan multi-region campaigns." },
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
