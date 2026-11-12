import { toE164Phone } from "@/utils/helper";
import type { FieldError } from "@/components/sponsor/sponsor-api";
import { US_STATE_OPTIONS } from "@/components/organization/org-form/form";
import type { OrgSignUpOptions } from "@/utils/types/auth";

// Organisation sign-up (design: docs/ui/Signin&signup-html; API: FANHUB_ORG_SIGNUP_FRONTEND.md). Everything is
// sent once, on the last step, as one multipart POST /fanhub/org-auth/signup that creates the account and the
// organisation together. Step 6 is the "account created" screen.
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

// GET /signup/options answers fixed lists (constants in the API, which also takes the labels). The form starts
// from this copy of them and switches to the API's answer when it arrives, so a slow or failed options request
// never stops a sign-up; the API checks every field on submit anyway.
export const FALLBACK_OPTIONS: OrgSignUpOptions = {
  organizationTypes: [
    { code: "SCHOOL", label: "School", hasLevel: true },
    { code: "TOURNAMENT", label: "Tournament", hasLevel: false },
    { code: "CLUB_TEAM", label: "Club Team", hasLevel: false },
    { code: "LEAGUE", label: "League", hasLevel: false },
  ],
  levels: [
    { code: "MIDDLE_SCHOOL", label: "Middle School" },
    { code: "HIGH_SCHOOL", label: "High School" },
    { code: "HIGH_MIDDLE", label: "High / Middle School" },
  ],
  // The same 51 (with DC) as the API's, in its order.
  states: US_STATE_OPTIONS.map((s) => ({ code: s.value, label: s.label })),
  password: { minLength: 8, requiresNumber: true },
  logo: { types: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"], maxBytes: 2 * 1024 * 1024, minPixels: 512 },
};

// The chosen type asks for a level (a school).
export const hasLevel = (options: OrgSignUpOptions, type: string) =>
  options.organizationTypes.some((t) => t.code === type && t.hasLevel);

// The form, named as the API's fields (so its error paths are the form's fields).
export interface OrgSignUpForm {
  // Step 1: the person who manages the Fan Hub (the sign-in account).
  fullName: string;
  email: string;
  password: string;
  // Optional; masked as typed, "(555) 123-4567".
  phone: string;
  // Step 2
  organizationName: string;
  // A type code ("SCHOOL"…); "" until chosen.
  organizationType: string;
  // A level code ("HIGH_MIDDLE"…), only for a type with a level.
  level: string;
  description: string;
  // Step 3: where the games happen (the pin from the map, e.g. "28.538336"), and who fans and sponsors reach.
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  conference: string;
  contactName: string;
  contactPosition: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  // Step 4
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
}

export const INITIAL_FORM: OrgSignUpForm = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  organizationName: "",
  organizationType: "",
  level: "",
  description: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  latitude: "",
  longitude: "",
  conference: "",
  contactName: "",
  contactPosition: "",
  contactPhone: "",
  contactEmail: "",
  website: "",
  // The design's starting colours.
  primaryColor: "#FD212C",
  secondaryColor: "#FF525A",
  accentColor: "#F58220",
  facebookUrl: "",
  instagramUrl: "",
  xUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
};

// The location fields the map fills together.
export type MapField = "streetAddress" | "city" | "state" | "zipCode" | "latitude" | "longitude";

// The API's description limit.
export const DESCRIPTION_MAX = 2000;

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// What every step gets from the wizard.
export interface StepProps {
  form: OrgSignUpForm;
  errors: Record<string, string>;
  // For an input, textarea or select: its change event.
  onField: (field: keyof OrgSignUpForm) => (e: React.ChangeEvent<FieldElement>) => void;
  // For a control that gives the value itself (phone, colour).
  onValue: (field: keyof OrgSignUpForm) => (value: string) => void;
}

const TYPE_NAMES: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WEBP",
  "image/svg+xml": "SVG",
};

// "PNG, JPG, WEBP or SVG": the logo file types the API takes.
const logoKinds = (types: string[]) => {
  const names = types.map((t) => TYPE_NAMES[t] ?? t);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : (names[0] ?? "");
};

// "PNG, JPG, WEBP or SVG · at least 512×512 · up to 2 MB", from the API's logo rules.
export const logoRuleText = ({ types, maxBytes, minPixels }: OrgSignUpOptions["logo"]) =>
  `${logoKinds(types)} · at least ${minPixels}×${minPixels} · up to ${Math.round(maxBytes / (1024 * 1024))} MB`;

// Why the API would refuse this logo (its rules), or null when it's fine. SVG has no size in pixels.
export async function logoProblem(file: File, { types, maxBytes, minPixels }: OrgSignUpOptions["logo"]): Promise<string | null> {
  if (!types.includes(file.type)) return `Use a ${logoKinds(types)} file.`;
  if (file.size > maxBytes) return `Use a file of ${Math.round(maxBytes / (1024 * 1024))} MB or less.`;
  if (file.type === "image/svg+xml") return null;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img.naturalWidth < minPixels || img.naturalHeight < minPixels
      ? `Use an image at least ${minPixels}×${minPixels} pixels (this one is ${img.naturalWidth}×${img.naturalHeight}).`
      : null;
  } catch {
    return "We couldn't read this image. Try another file.";
  } finally {
    URL.revokeObjectURL(url);
  }
}

const PHONE_FIELDS = new Set<keyof OrgSignUpForm>(["phone", "contactPhone"]);

// The multipart body for POST /signup (the guide's §6.2): every filled field trimmed, empty ones left out, the
// level only for a type that has one, phones as E.164 (as the Profile saves them), and the logo file.
export function signUpFormData(form: OrgSignUpForm, logo: File | null, options: OrgSignUpOptions): FormData {
  const data = new FormData();
  const withLevel = hasLevel(options, form.organizationType);
  for (const [key, raw] of Object.entries(form) as [keyof OrgSignUpForm, string][]) {
    if (key === "level" && !withLevel) continue;
    if (key === "password") {
      data.append(key, raw);
      continue;
    }
    const value = raw.trim();
    if (value) data.append(key, PHONE_FIELDS.has(key) ? toE164Phone(value) : value);
  }
  if (logo) data.append("logo", logo);
  return data;
}

// The step that holds each field (the API's error paths are the form's field names).
const STEP_OF: Record<string, number> = {
  fullName: 1,
  email: 1,
  password: 1,
  phone: 1,
  organizationName: 2,
  organizationType: 2,
  level: 2,
  description: 2,
  streetAddress: 3,
  city: 3,
  state: 3,
  zipCode: 3,
  latitude: 3,
  longitude: 3,
  conference: 3,
  contactName: 3,
  contactPosition: 3,
  contactPhone: 3,
  contactEmail: 3,
  website: 3,
  primaryColor: 4,
  secondaryColor: 4,
  accentColor: 4,
  facebookUrl: 4,
  instagramUrl: 4,
  xUrl: 4,
  youtubeUrl: 4,
  tiktokUrl: 4,
};

export interface SignUpProblem {
  step: number;
  errors: Record<string, string>;
}

// A refusal goes back to the step that holds the failing field, with the message under it; null when it belongs
// to no field (429, 500…) and is shown as a toast. A taken email (409) and the logo's problems come without a
// `path`: the email goes to step 1, a "Logo …" message under the logo. The pin's two fields share the map's line.
export function placeSignUpError(status: number, message: string, errors: FieldError[]): SignUpProblem | null {
  if (status === 409) return { step: 1, errors: { email: message } };
  if (!errors.length && /^logo\b/i.test(message)) return { step: 4, errors: { logo: message } };
  const placed = errors.flatMap((e) => {
    const field = e.path.split(".")[0];
    return STEP_OF[field]
      ? [{ field: field === "longitude" ? "latitude" : field, step: STEP_OF[field], message: e.message }]
      : [];
  });
  if (!placed.length) return null;
  const step = Math.min(...placed.map((p) => p.step));
  const fields: Record<string, string> = {};
  for (const p of placed) if (p.step === step && !fields[p.field]) fields[p.field] = p.message;
  return { step, errors: fields };
}
