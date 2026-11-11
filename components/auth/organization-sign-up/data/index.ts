import type { FieldError } from "@/components/sponsor/sponsor-api";
import { INITIAL_ORG_FORM, type OrgFormState } from "@/components/organization/org-form/form";

// Organisation sign-up (design: docs/ui/Signin&signup-html). Step 6 is the "account created" screen.
export const STEPS = ["Account", "Organization", "Location", "Branding", "Review"] as const;
export const REVIEW_STEP = STEPS.length;
export const DONE_STEP = STEPS.length + 1;

// The brand panel beside the form.
export const BRAND_PANEL = {
  mark: { src: "/icons/logo-union.svg", width: 44, height: 38 },
  name: "DIME FAN HUB",
  title: "Give your fans a home for every game",
  text: "Build your Fan Hub with schedules, teams and live scores, then find sponsors and fund the things your teams need.",
  perks: [
    "Your own Fan Hub with schedule, standings, brackets and media",
    "Sponsor packages plus an AI agent that finds and follows up with local sponsors",
    "Fundable needs, each with its own virtual card",
  ],
  already: "Already have an account?",
};

// The API's genders (on a team; the organisation has no gender yet).
export const GENDER_OPTIONS = ["Boys", "Girls", "Coed"] as const;

// The organisation fields are the setup / Profile form's (OrgFormState), so the details are sent exactly as
// the Profile page sends them. There, `email` and `phone` are the contact's (step 3); the account's are below.
export interface OrgSignUpForm extends OrgFormState {
  fullName: string;
  accountEmail: string;
  password: string;
  // Optional; masked as typed, "(555) 123-4567".
  accountPhone: string;
  gender: string;
  // Where the organisation is, from the map (or typed), e.g. "28.538336" and "-81.379234". Sponsors' distance
  // search uses it. The API doesn't keep it on an organisation yet; it's sent so it's stored once it does.
  latitude: string;
  longitude: string;
}

// The location fields the map fills together.
export type MapField = "streetAddress" | "city" | "state" | "zipCode" | "latitude" | "longitude";

export const INITIAL_FORM: OrgSignUpForm = {
  ...INITIAL_ORG_FORM,
  // The design's starting colours.
  primaryColor: "#FD212C",
  secondaryColor: "#FF525A",
  accentColor: "#F58220",
  fullName: "",
  accountEmail: "",
  password: "",
  accountPhone: "",
  gender: "",
  latitude: "",
  longitude: "",
};

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// What every step gets from the wizard.
export interface StepProps {
  form: OrgSignUpForm;
  errors: Record<string, string>;
  // For an input, textarea or select: its change event.
  onField: (field: keyof OrgSignUpForm) => (e: React.ChangeEvent<FieldElement>) => void;
  // For a control that gives the value itself (phone, colour, gender).
  onValue: (field: keyof OrgSignUpForm) => (value: string) => void;
}

// The logo the API takes: PNG, JPG or SVG, up to 2 MB, a raster one at least 512×512. (A file it refuses
// comes back as a 500 without a reason, so it's checked here first.)
export const LOGO_ACCEPT = "image/png,image/jpeg,image/svg+xml";
export const LOGO_RULE = "PNG, JPG or SVG · at least 512×512 · up to 2 MB";
const LOGO_TYPES = LOGO_ACCEPT.split(",");
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_MIN_PX = 512;

// Why the API would refuse this logo, or null when it's fine.
export async function logoProblem(file: File): Promise<string | null> {
  if (!LOGO_TYPES.includes(file.type)) return "Use a PNG, JPG or SVG file.";
  if (file.size > LOGO_MAX_BYTES) return "Use a file of 2 MB or less.";
  if (file.type === "image/svg+xml") return null;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img.naturalWidth < LOGO_MIN_PX || img.naturalHeight < LOGO_MIN_PX
      ? `Use an image at least ${LOGO_MIN_PX}×${LOGO_MIN_PX} pixels (this one is ${img.naturalWidth}×${img.naturalHeight}).`
      : null;
  } catch {
    return "We couldn't read this image. Try another file.";
  } finally {
    URL.revokeObjectURL(url);
  }
}

// The API's field names (sign-up, then the organisation update) → the form field and the step that holds it.
const FIELD_STEPS: Record<string, { field: string; step: number }> = {
  email: { field: "accountEmail", step: 1 },
  password: { field: "password", step: 1 },
  phone: { field: "accountPhone", step: 1 },
  name: { field: "organizationName", step: 2 },
  organizationType: { field: "organizationType", step: 2 },
  eventType: { field: "eventType", step: 2 },
  teamName: { field: "teamName", step: 2 },
  sportsType: { field: "sport", step: 2 },
  level: { field: "level", step: 2 },
  gender: { field: "gender", step: 2 },
  description: { field: "description", step: 2 },
  streetAddress: { field: "streetAddress", step: 3 },
  city: { field: "city", step: 3 },
  state: { field: "state", step: 3 },
  zipCode: { field: "zipCode", step: 3 },
  league: { field: "conference", step: 3 },
  // Both shown under the map.
  latitude: { field: "latitude", step: 3 },
  longitude: { field: "latitude", step: 3 },
  contactName: { field: "contactName", step: 3 },
  contactPosition: { field: "contactPosition", step: 3 },
  contactPhone: { field: "phone", step: 3 },
  contactEmail: { field: "email", step: 3 },
  website: { field: "website", step: 3 },
  colors: { field: "primaryColor", step: 4 },
  secondaryColor: { field: "secondaryColor", step: 4 },
  accentColor: { field: "accentColor", step: 4 },
  facebookUrl: { field: "facebookUrl", step: 4 },
  instagramUrl: { field: "instagramUrl", step: 4 },
  xUrl: { field: "xUrl", step: 4 },
  youtubeUrl: { field: "youtubeUrl", step: 4 },
  tiktokUrl: { field: "tiktokUrl", step: 4 },
  logo: { field: "logo", step: 4 },
};

export interface SignUpProblem {
  step: number;
  errors: Record<string, string>;
}

// Errors only come back on "Create organization account", so a refusal goes back to the step that holds the
// failing field, with the message under it; null when it belongs to no field (429, 500…) and is shown as a
// toast. A taken email (409) comes without a `path`.
export function placeSignUpError(status: number, message: string, errors: FieldError[]): SignUpProblem | null {
  if (status === 409) return { step: 1, errors: { accountEmail: message } };
  const placed = errors.flatMap((e) => (FIELD_STEPS[e.path] ? [{ ...FIELD_STEPS[e.path], message: e.message }] : []));
  if (!placed.length) return null;
  const step = Math.min(...placed.map((p) => p.step));
  const fields: Record<string, string> = {};
  for (const p of placed) if (p.step === step && !fields[p.field]) fields[p.field] = p.message;
  return { step, errors: fields };
}
