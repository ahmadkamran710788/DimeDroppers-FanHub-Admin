import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import * as yup from "yup";
import type { SavedSchool } from "@/utils/types/school";

// Organization profile form: options, state, validation and the school ⇄ form mapping.
// Shared by the Setup Wizard "Organization Details" step and the Profile page edit dialogs.

export interface Option {
  label: string;
  value: string;
}

export const LEVEL_OPTIONS: Option[] = [
  { label: "High School", value: "high-school" },
  { label: "Middle School", value: "middle-school" },
  { label: "League", value: "league" },
  { label: "Tournament", value: "tournament" },
  { label: "Club Team", value: "club-team" },
];

export const SPORT_OPTIONS: Option[] = [
  { label: "Basketball", value: "basketball" },
  { label: "Football", value: "football" },
  { label: "Soccer", value: "soccer" },
  { label: "Baseball", value: "baseball" },
  { label: "Volleyball", value: "volleyball" },
  { label: "Track & Field", value: "track-field" },
  { label: "Swimming", value: "swimming" },
  { label: "Wrestling", value: "wrestling" },
];

export const ORG_TYPE_OPTIONS: Option[] = [
  { label: "School", value: "school" },
  { label: "League", value: "league" },
  { label: "Club Team", value: "club-team" },
  { label: "Tournament", value: "tournament" },
];

export const EVENT_TYPE_OPTIONS: Option[] = [
  { label: "Camp", value: "camp" },
  { label: "Clinic", value: "clinic" },
  { label: "Tournament", value: "tournament" },
  { label: "Showcase", value: "showcase" },
];

// Shows the full state name; submits the 2-letter abbreviation (e.g. "FL").
export const US_STATE_OPTIONS: Option[] = [
  { label: "Alabama", value: "AL" },
  { label: "Alaska", value: "AK" },
  { label: "Arizona", value: "AZ" },
  { label: "Arkansas", value: "AR" },
  { label: "California", value: "CA" },
  { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" },
  { label: "Delaware", value: "DE" },
  { label: "District of Columbia", value: "DC" },
  { label: "Florida", value: "FL" },
  { label: "Georgia", value: "GA" },
  { label: "Hawaii", value: "HI" },
  { label: "Idaho", value: "ID" },
  { label: "Illinois", value: "IL" },
  { label: "Indiana", value: "IN" },
  { label: "Iowa", value: "IA" },
  { label: "Kansas", value: "KS" },
  { label: "Kentucky", value: "KY" },
  { label: "Louisiana", value: "LA" },
  { label: "Maine", value: "ME" },
  { label: "Maryland", value: "MD" },
  { label: "Massachusetts", value: "MA" },
  { label: "Michigan", value: "MI" },
  { label: "Minnesota", value: "MN" },
  { label: "Mississippi", value: "MS" },
  { label: "Missouri", value: "MO" },
  { label: "Montana", value: "MT" },
  { label: "Nebraska", value: "NE" },
  { label: "Nevada", value: "NV" },
  { label: "New Hampshire", value: "NH" },
  { label: "New Jersey", value: "NJ" },
  { label: "New Mexico", value: "NM" },
  { label: "New York", value: "NY" },
  { label: "North Carolina", value: "NC" },
  { label: "North Dakota", value: "ND" },
  { label: "Ohio", value: "OH" },
  { label: "Oklahoma", value: "OK" },
  { label: "Oregon", value: "OR" },
  { label: "Pennsylvania", value: "PA" },
  { label: "Rhode Island", value: "RI" },
  { label: "South Carolina", value: "SC" },
  { label: "South Dakota", value: "SD" },
  { label: "Tennessee", value: "TN" },
  { label: "Texas", value: "TX" },
  { label: "Utah", value: "UT" },
  { label: "Vermont", value: "VT" },
  { label: "Virginia", value: "VA" },
  { label: "Washington", value: "WA" },
  { label: "West Virginia", value: "WV" },
  { label: "Wisconsin", value: "WI" },
  { label: "Wyoming", value: "WY" },
];

export type OrgFormState = {
  organizationName: string;
  organizationType: string;
  eventType: string;
  teamName: string;
  level: string;
  sport: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  conference: string;
  description: string;
  contactName: string;
  contactPosition: string;
  phone: string;
  email: string;
  website: string;
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export const INITIAL_ORG_FORM: OrgFormState = {
  organizationName: "",
  organizationType: "",
  eventType: "",
  teamName: "",
  level: "",
  sport: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  conference: "",
  description: "",
  contactName: "",
  contactPosition: "",
  phone: "",
  email: "",
  website: "",
  facebookUrl: "",
  instagramUrl: "",
  xUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
  primaryColor: "#000000",
  secondaryColor: "#000000",
  accentColor: "#231F20",
};

// Event Type, Team Name, Sport and Level only apply to club teams; for schools, leagues
// and tournaments they are hidden, not validated and not sent.
export const CLUB_TEAM = "club-team";
export const isClubTeam = (organizationType: string) => organizationType === CLUB_TEAM;

export const orgSchema = yup.object({
  organizationName: yup.string().required("Organization name is required"),
  organizationType: yup.string().required("Organization type is required"),
  eventType: yup.string().when("organizationType", {
    is: CLUB_TEAM,
    then: (s) => s.required("Event type is required"),
    otherwise: (s) => s.notRequired(),
  }),
  teamName: yup.string().when("organizationType", {
    is: CLUB_TEAM,
    then: (s) => s.required("Team name is required"),
    otherwise: (s) => s.notRequired(),
  }),
  level: yup.string().when("organizationType", {
    is: CLUB_TEAM,
    then: (s) => s.required("Level is required"),
    otherwise: (s) => s.notRequired(),
  }),
  sport: yup.string().when("organizationType", {
    is: CLUB_TEAM,
    then: (s) => s.required("Sport is required"),
    otherwise: (s) => s.notRequired(),
  }),
  streetAddress: yup.string().required("Street address is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  zipCode: yup
    .string()
    .required("Zip code is required")
    .matches(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  conference: yup.string().required("Conference/Division is required"),
  description: yup.string().optional().max(250, "Max 250 characters"),
  contactName: yup.string().required("Contact name is required"),
  contactPosition: yup.string().required("Position is required"),
  phone: yup
    .string()
    .required("Phone is required")
    .test("us-phone", "Enter a valid US phone number", (v) => !!v && isValidPhoneNumber(v, "US")),
  email: yup.string().required("Email is required").email("Enter a valid email"),
  website: yup.string().required("Website is required").url("Enter a valid URL"),
  facebookUrl: yup.string().url("Enter a valid URL").notRequired(),
  instagramUrl: yup.string().url("Enter a valid URL").notRequired(),
  xUrl: yup.string().url("Enter a valid URL").notRequired(),
  youtubeUrl: yup.string().url("Enter a valid URL").notRequired(),
  tiktokUrl: yup.string().url("Enter a valid URL").notRequired(),
});

// The form stores option slugs (e.g. "high-school"); the API expects the human label
// (e.g. "High School"). Falls back to the raw value if no matching option is found.
export const labelOf = (options: Option[], value: string) => options.find((o) => o.value === value)?.label ?? value;

// Inverse of labelOf — a saved school's select fields come back as labels.
const valueOf = (options: Option[], label: string | null) => options.find((o) => o.label === label)?.value ?? "";

// contactPhone is stored in E.164 ("+14155555013"); the masked PhoneInput expects the 10
// national digits ("4155555013").
const toNationalDigits = (e164: string | null) => {
  if (!e164) return "";
  try {
    return String(parsePhoneNumber(e164, "US").nationalNumber);
  } catch {
    return e164;
  }
};

// Form state from a saved school; empty fields fall back to `base`.
export function orgFormFromSchool(school: SavedSchool, base: OrgFormState = INITIAL_ORG_FORM): OrgFormState {
  return {
    ...base,
    organizationName: school.name ?? base.organizationName,
    organizationType: valueOf(ORG_TYPE_OPTIONS, school.organizationType) || base.organizationType,
    eventType: valueOf(EVENT_TYPE_OPTIONS, school.eventType) || base.eventType,
    teamName: school.teamName ?? base.teamName,
    level: valueOf(LEVEL_OPTIONS, school.level) || base.level,
    sport: SPORT_OPTIONS.find((o) => o.value === school.sportsType)?.value ?? base.sport,
    streetAddress: school.streetAddress ?? base.streetAddress,
    city: school.city ?? base.city,
    state: school.state ?? base.state,
    zipCode: school.zipCode ?? base.zipCode,
    conference: school.league ?? base.conference,
    description: school.description ?? base.description,
    contactName: school.contactName ?? base.contactName,
    contactPosition: school.contactPosition ?? base.contactPosition,
    phone: toNationalDigits(school.contactPhone) || base.phone,
    email: school.contactEmail ?? base.email,
    website: school.website ?? base.website,
    facebookUrl: school.facebookUrl ?? "",
    instagramUrl: school.instagramUrl ?? "",
    xUrl: school.xUrl ?? "",
    youtubeUrl: school.youtubeUrl ?? "",
    tiktokUrl: school.tiktokUrl ?? "",
    primaryColor: school.colors?.primaryColor ?? base.primaryColor,
    secondaryColor: school.colors?.secondaryColor ?? base.secondaryColor,
    accentColor: school.colors?.accentColor ?? base.accentColor,
  };
}

// Multipart body for the create / update school endpoints.
export function orgFormToFormData(form: OrgFormState, logoFile: File | null): FormData {
  const body = new FormData();
  body.append("name", form.organizationName);
  body.append("organizationType", labelOf(ORG_TYPE_OPTIONS, form.organizationType));
  if (isClubTeam(form.organizationType)) {
    body.append("eventType", labelOf(EVENT_TYPE_OPTIONS, form.eventType));
    body.append("teamName", form.teamName);
    body.append("level", labelOf(LEVEL_OPTIONS, form.level));
    body.append("sportsType", form.sport);
  }
  body.append("streetAddress", form.streetAddress);
  body.append("city", form.city);
  body.append("state", form.state);
  body.append("zipCode", form.zipCode);
  body.append("league", form.conference);
  body.append("description", form.description);
  body.append("contactName", form.contactName);
  body.append("contactPosition", form.contactPosition);
  body.append("contactPhone", form.phone ? parsePhoneNumber(form.phone, "US").number : "");
  body.append("contactEmail", form.email);
  body.append("website", form.website);
  body.append("facebookUrl", form.facebookUrl);
  body.append("instagramUrl", form.instagramUrl);
  body.append("xUrl", form.xUrl);
  body.append("youtubeUrl", form.youtubeUrl);
  body.append("tiktokUrl", form.tiktokUrl);
  body.append("colors", form.primaryColor);
  body.append("secondaryColor", form.secondaryColor);
  body.append("accentColor", form.accentColor);
  if (logoFile) body.append("logo", logoFile);
  return body;
}

// Shared by the organization field-group components (org-team-fields, contact-fields, …).
// Each group renders on a dark surface and is reused by the Setup Wizard step and the
// Profile edit dialogs.
export interface FieldGroupProps {
  form: OrgFormState;
  errors: Record<string, string>;
  set: (field: keyof OrgFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setValue: (field: keyof OrgFormState) => (value: string) => void;
}

export const FIELD_LABEL = "text-white";
export const FIELD_GRID = "grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6";
