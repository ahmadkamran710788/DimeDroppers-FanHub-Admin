"use client";

import CheckCircle from "@/components/common/CheckCircle";
import ColorPicker from "@/components/common/ColorPicker";
import FileUpload from "@/components/common/FileUpload";
import Input from "@/components/common/Input";
import PhoneInput from "@/components/common/PhoneInput";
import SectionCard from "@/components/common/SectionCard";
import Select from "@/components/common/Select";
import StepIndicator from "@/components/common/StepIndicator";
import Textarea from "@/components/common/Textarea";
import WizardFooter from "@/components/common/WizardFooter";
import { validateAndSetErrors } from "@/utils/validation";
import { useSetup } from "@/context/setup";
import { routes } from "@/utils/routes";
import { Circle, MapPin, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as yup from "yup";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";

const schema = yup.object({
  organizationName: yup.string().required("Organization name is required"),
  organizationType: yup.string().required("Organization type is required"),
  eventType: yup.string().required("Event type is required"),
  teamName: yup.string().required("Team name is required"),
  level: yup.string().required("Level is required"),
  sport: yup.string().required("Sport is required"),
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

const LEVEL_OPTIONS = [
  { label: "High School", value: "high-school" },
  { label: "Middle School", value: "middle-school" },
  { label: "League", value: "league" },
  { label: "Tournament", value: "tournament" },
  { label: "Club Team", value: "club-team" },
];

const SPORT_OPTIONS = [
  { label: "Basketball", value: "basketball" },
  { label: "Football", value: "football" },
  { label: "Soccer", value: "soccer" },
  { label: "Baseball", value: "baseball" },
  { label: "Volleyball", value: "volleyball" },
  { label: "Track & Field", value: "track-field" },
  { label: "Swimming", value: "swimming" },
  { label: "Wrestling", value: "wrestling" },
];

const ORG_TYPE_OPTIONS = [
  { label: "School", value: "school" },
  { label: "League", value: "league" },
  { label: "Club Team", value: "club-team" },
  { label: "Tournament", value: "tournament" },
];

const EVENT_TYPE_OPTIONS = [
  { label: "Camp", value: "camp" },
  { label: "Clinic", value: "clinic" },
  { label: "Tournament", value: "tournament" },
  { label: "Showcase", value: "showcase" },
];

// Shows the full state name; submits the 2-letter abbreviation (e.g. "FL").
const US_STATE_OPTIONS = [
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

type FormState = {
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

const INITIAL: FormState = {
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

type ChecklistItem = {
  label: string;
  done: (f: FormState, logoUploaded: boolean) => boolean;
};

const CHECKLIST: ChecklistItem[] = [
  { label: "Organization Name", done: (f) => !!f.organizationName },
  { label: "Organization Type", done: (f) => !!f.organizationType },
  { label: "Team Name", done: (f) => !!f.teamName },
  { label: "Sport", done: (f) => !!f.sport },
  { label: "Level", done: (f) => !!f.level },
  { label: "Address", done: (f) => !!(f.streetAddress && f.city && f.state && f.zipCode) },
  { label: "Conference\\League", done: (f) => !!f.conference },
  { label: "Description", done: (f) => !!f.description },
  { label: "Contact Information", done: (f) => !!(f.contactName && f.contactPosition && f.phone && f.email && f.website) },
  {
    label: "Social Media (Optional)",
    done: (f) => !!(f.facebookUrl || f.instagramUrl || f.xUrl || f.youtubeUrl || f.tiktokUrl),
  },
  {
    label: "Branding (Optional)",
    done: (f, logoUploaded) =>
      logoUploaded ||
      f.primaryColor !== "#000000" ||
      f.secondaryColor !== "#000000" ||
      f.accentColor !== "#231F20",
  },
];

// Converts "#0B6F81" → "rgba(11, 111, 129, <alpha>)". Falls back to black on bad input.
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(0, 0, 0, ${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function OrganizationDetailsPage() {
  const router = useRouter();
  const { savedSchool, refreshSchool } = useSetup();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onPhoneChange = (value: string) =>
    setForm((prev) => ({ ...prev, phone: value }));

  const setColor = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // The form stores option slugs (e.g. "high-school"); the API expects the human label
  // (e.g. "High School"). Fall back to the raw value if no matching option is found.
  const labelOf = (options: { label: string; value: string }[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  // Inverse of labelOf — used when rehydrating from a saved school, whose select fields
  // come back as labels (e.g. "High School"). Maps the label back to the form slug.
  const valueOf = (options: { label: string; value: string }[], label: string | null) =>
    options.find((o) => o.label === label)?.value ?? "";

  // contactPhone is stored in E.164 (e.g. "+14155555013"); the masked PhoneInput expects
  // the 10 national digits ("4155555013") — feeding it the raw E.164 makes the mask drop
  // the "+1" and the last digit. Convert back to national digits here.
  const toNationalDigits = (e164: string | null) => {
    if (!e164) return "";
    try {
      return String(parsePhoneNumber(e164, "US").nationalNumber);
    } catch {
      return e164;
    }
  };

  // Prefill the form once SetupContext has loaded the saved school. Runs when
  // savedSchool becomes available (context fetches it once for all wizard steps).
  useEffect(() => {
    if (!savedSchool) return;
    const school = savedSchool;
    setForm((prev) => ({
      ...prev,
      organizationName: school.name ?? prev.organizationName,
      organizationType: valueOf(ORG_TYPE_OPTIONS, school.organizationType) || prev.organizationType,
      eventType: valueOf(EVENT_TYPE_OPTIONS, school.eventType) || prev.eventType,
      teamName: school.teamName ?? prev.teamName,
      level: valueOf(LEVEL_OPTIONS, school.level) || prev.level,
      sport: SPORT_OPTIONS.find((o) => o.value === school.sportsType)?.value ?? prev.sport,
      streetAddress: school.streetAddress ?? prev.streetAddress,
      city: school.city ?? prev.city,
      state: school.state ?? prev.state,
      zipCode: school.zipCode ?? prev.zipCode,
      conference: school.league ?? prev.conference,
      description: school.description ?? prev.description,
      contactName: school.contactName ?? prev.contactName,
      contactPosition: school.contactPosition ?? prev.contactPosition,
      phone: toNationalDigits(school.contactPhone) || prev.phone,
      email: school.contactEmail ?? prev.email,
      website: school.website ?? prev.website,
      facebookUrl: school.facebookUrl ?? "",
      instagramUrl: school.instagramUrl ?? "",
      xUrl: school.xUrl ?? "",
      youtubeUrl: school.youtubeUrl ?? "",
      tiktokUrl: school.tiktokUrl ?? "",
      primaryColor: school.colors?.primaryColor ?? prev.primaryColor,
      secondaryColor: school.colors?.secondaryColor ?? prev.secondaryColor,
      accentColor: school.colors?.accentColor ?? prev.accentColor,
    }));
    if (school.logoUrl) setLogoUrl(school.logoUrl);
  }, [savedSchool]);

  const handleNext = async () => {
    const valid = await validateAndSetErrors(schema as yup.ObjectSchema<Record<string, unknown>>, form, setErrors);
    if (!valid) return;

    const body = new FormData();
    body.append("name", form.organizationName);
    body.append("organizationType", labelOf(ORG_TYPE_OPTIONS, form.organizationType));
    body.append("eventType", labelOf(EVENT_TYPE_OPTIONS, form.eventType));
    body.append("teamName", form.teamName);
    body.append("level", labelOf(LEVEL_OPTIONS, form.level));
    body.append("sportsType", form.sport);
    body.append("streetAddress", form.streetAddress);
    body.append("city", form.city);
    body.append("state", form.state);
    body.append("zipCode", form.zipCode);
    body.append("league", form.conference);
    body.append("description", form.description);
    body.append("contactName", form.contactName);
    body.append("contactPosition", form.contactPosition);
    body.append("contactPhone", parsePhoneNumber(form.phone, "US").number);
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

    // Create the school on first submit; on a Back→Next re-submit (schoolId already in
    // sessionStorage) PUT the same payload to update the existing school instead of
    // creating a duplicate. The logo is only sent when the user picked a new file.
    const existingSchoolId = sessionStorage.getItem("fanhub:schoolId");

    setIsSubmitting(true);
    try {
      const res = existingSchoolId
        ? await fetch(
            `${routes.api.proxyUpdateSchool}?schoolId=${encodeURIComponent(existingSchoolId)}`,
            { method: "PUT", body }
          )
        : await fetch(routes.api.proxyCreateSchool, { method: "POST", body });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          json?.message ||
            `Failed to ${existingSchoolId ? "update" : "create"} school. Please try again.`
        );
        return;
      }

      const schoolId = json?.data?.[0]?.school?.id ?? existingSchoolId;
      if (schoolId) sessionStorage.setItem("fanhub:schoolId", String(schoolId));
      if (form.teamName) sessionStorage.setItem("fanhub:teamName", form.teamName);

      // Refetch so a Back navigation rehydrates Step 1 from fresh data, not the
      // stale snapshot SetupContext fetched at mount (mirrors Step 3's pattern).
      await refreshSchool();

      toast.success(existingSchoolId ? "School updated" : "School created");
      router.push(routes.ui.setupWizard.importSchedule);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = form.organizationName
    ? form.organizationName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "TL";

  return (
    <div className="flex flex-col gap-6 pb-24">
      <StepIndicator currentStep={1} />

      <div className="flex flex-col gap-2 -mt-2">
        <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
          Configure Organization Details
        </h2>
        <p className="text-base text-white/80">
          Tell us about your organization and team to create your Fan Hub.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        {/* LEFT — form sections */}
        <div className="flex flex-col gap-6 lg:gap-10 flex-1 min-w-0">
          <SectionCard title="Organization & Team Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <Input label="Organization Name" name="organizationName" value={form.organizationName} onChange={set("organizationName")} placeholder="Twin Lakes Academy Middle School" error={errors.organizationName} className="col-span-2" labelClassName="text-white" />
              <Select label="Organization Type" name="organizationType" value={form.organizationType} onChange={set("organizationType")} options={ORG_TYPE_OPTIONS} placeholder="Select organization type" error={errors.organizationType} className="col-span-2" labelClassName="text-white" />
              <Select label="Event Type" name="eventType" value={form.eventType} onChange={set("eventType")} options={EVENT_TYPE_OPTIONS} placeholder="Select event type" error={errors.eventType} className="col-span-2" labelClassName="text-white" />
              <Input label="Team Name" name="teamName" value={form.teamName} onChange={set("teamName")} placeholder="TLAM" error={errors.teamName} className="col-span-2" labelClassName="text-white" />
              <Select label="Level" name="level" value={form.level} onChange={set("level")} options={LEVEL_OPTIONS} placeholder="Select level" error={errors.level} labelClassName="text-white" />
              <Select label="Sport" name="sport" value={form.sport} onChange={set("sport")} options={SPORT_OPTIONS} placeholder="Select sport" error={errors.sport} labelClassName="text-white" />
              <Input label="Street Address" name="streetAddress" value={form.streetAddress} onChange={set("streetAddress")} placeholder="1234 Lakeview Dr" icon={<MapPin className="w-5 h-5" />} error={errors.streetAddress} className="col-span-2" labelClassName="text-white" />
              <Input label="City" name="city" value={form.city} onChange={set("city")} placeholder="Fort Lauderdale" error={errors.city} labelClassName="text-white" />
              <Select label="State" name="state" value={form.state} onChange={set("state")} options={US_STATE_OPTIONS} placeholder="Select state" error={errors.state} labelClassName="text-white" />
              <Input label="Zip Code" name="zipCode" value={form.zipCode} onChange={set("zipCode")} placeholder="33301" error={errors.zipCode} labelClassName="text-white" />
              <Input label="Conference/Division" name="conference" value={form.conference} onChange={set("conference")} placeholder="Eastern Lakes Conference" icon={<MapPin className="w-5 h-5" />} error={errors.conference} labelClassName="text-white" />
              <Textarea label="Description" name="description" value={form.description} onChange={set("description")} maxLength={250} placeholder="The Official fan hub for your team..." error={errors.description} className="col-span-2" />
            </div>
          </SectionCard>

          <SectionCard title="Contact Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <Input label="Contact Name" name="contactName" value={form.contactName} onChange={set("contactName")} placeholder="John Doe" error={errors.contactName} labelClassName="text-white" />
              <Input label="Position" name="contactPosition" value={form.contactPosition} onChange={set("contactPosition")} placeholder="Athletic Director" error={errors.contactPosition} labelClassName="text-white" />
              <PhoneInput label="Phone" name="phone" value={form.phone} onValueChange={onPhoneChange} placeholder="(555) 123-4567" error={errors.phone} />
              <Input label="Email" name="email" value={form.email} onChange={set("email")} placeholder="johndoe@tlam.com" type="email" error={errors.email} labelClassName="text-white" />
              <Input label="Website" name="website" value={form.website} onChange={set("website")} placeholder="https://www.tlam.com" type="url" error={errors.website} labelClassName="text-white" />
            </div>
          </SectionCard>

          <SectionCard title="Social Networks (optional)">
            <div className="flex flex-col gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Input label="Facebook" name="facebookUrl" value={form.facebookUrl} onChange={set("facebookUrl")} placeholder="https://" type="url" error={errors.facebookUrl} icon={<img src="/icons/step1/fb.svg" alt="" className="w-6 h-6" />} labelClassName="text-white" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Input label="Instagram" name="instagramUrl" value={form.instagramUrl} onChange={set("instagramUrl")} placeholder="https://" type="url" error={errors.instagramUrl} icon={<img src="/icons/step1/insta.svg" alt="" className="w-6 h-6" />} labelClassName="text-white" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Input label="X (Former Twitter)" name="xUrl" value={form.xUrl} onChange={set("xUrl")} placeholder="https://" type="url" error={errors.xUrl} icon={<img src="/icons/step1/x.svg" alt="" className="w-6 h-6" />} labelClassName="text-white" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Input label="Youtube" name="youtubeUrl" value={form.youtubeUrl} onChange={set("youtubeUrl")} placeholder="https://" type="url" error={errors.youtubeUrl} icon={<img src="/icons/step1/yt.svg" alt="" className="w-6 h-6" />} labelClassName="text-white" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Input label="TikTok" name="tiktokUrl" value={form.tiktokUrl} onChange={set("tiktokUrl")} placeholder="https://" type="url" error={errors.tiktokUrl} icon={<img src="/icons/step1/tiktok.svg" alt="" className="w-6 h-6" />} labelClassName="text-white" />
            </div>
          </SectionCard>

          <SectionCard title="Brand Basics (optional)" description="Apply brand colors for your page to make it with a unique look.">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ColorPicker label="Primary Color" name="primaryColor" value={form.primaryColor} onChange={setColor("primaryColor")} />
              <ColorPicker label="Secondary Color" name="secondaryColor" value={form.secondaryColor} onChange={setColor("secondaryColor")} />
              <ColorPicker label="Accent Color" name="accentColor" value={form.accentColor} onChange={setColor("accentColor")} />
            </div>
            <FileUpload
              label="Team Logo"
              variant="image"
              existingUrl={savedSchool?.logoUrl ?? undefined}
              onFile={(file, url) => {
                setLogoFile(file);
                setLogoUrl(url ?? null);
              }}
              onClear={() => {
                setLogoFile(null);
                setLogoUrl(savedSchool?.logoUrl ?? null);
              }}
            />
          </SectionCard>
        </div>

        {/* RIGHT — looks good / preview / checklist */}
        <div className="w-full lg:w-[480px] lg:shrink-0 flex flex-col gap-6">
          {/* 1. Looks Good card */}
          <div className="rounded-[8px] p-6 bg-[rgba(101,193,98,0.08)] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-success shrink-0" />
              <h3 className="text-2xl font-bold text-success">Looks Good!</h3>
            </div>
            <p className="text-sm text-white/80">
              {"You're off to a great start. Once you complete all required fields, you can move to the next step."}
            </p>
          </div>

          {/* 2. Preview card — outer wrapper */}
          <div
            className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px]"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <h3 className="font-display font-black text-[28px] uppercase text-white leading-none">
              Preview
            </h3>

            {/* Inner image card */}
            <div
              className="rounded-[12px] relative outline-2 outline-solid -outline-offset-2 outline-border-subtle"
              style={{
                backgroundImage: "url(/images/preview-bg.png)",
                backgroundSize: "cover",
                backgroundPosition: "center top",
              }}
            >
              {/* Gradient overlay — tinted with the selected Primary brand color */}
              <div
                className="absolute inset-0 rounded-[12px]"
                style={{
                  background: `linear-gradient(180deg, ${hexToRgba(form.primaryColor, 0.7)} 0%, ${hexToRgba(form.primaryColor, 1)} 100%)`,
                }}
              />
              <div className="relative z-10 p-6 flex flex-col gap-4">
                {/* Avatar — standalone, above org name. Shows the uploaded logo when present, else initials. */}
                <div
                  className="w-24 h-24 rounded-full shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background: logoUrl ? "#231F20" : "rgba(255,255,255,0.15)",
                    outline: "2px solid rgba(255,255,255,0.5)",
                    outlineOffset: "-2px",
                    backdropFilter: "blur(48px)",
                  }}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Team logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-sans font-normal" style={{ fontSize: 32, lineHeight: 1 }}>
                      {initials}
                    </span>
                  )}
                </div>
                {/* Org name — below avatar, full width */}
                <h4 className="font-display font-black text-[56px] uppercase text-white leading-none w-full">
                  {form.organizationName || "Twin Lakes Academy Middle School"}
                </h4>

                {/* Radial gradient separator */}
                <div
                  className="w-full"
                  style={{
                    height: "2px",
                    background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
                  }}
                />

                {/* Sport row */}
                {form.sport && (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/icon-dribbble.svg" alt="" width={24} height={24} className="shrink-0" />
                    <span className="text-white font-medium" style={{ fontSize: 14 }}>
                      {SPORT_OPTIONS.find((o) => o.value === form.sport)?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info rows below inner card */}
            <div className="flex flex-col gap-4">
              {form.organizationType && (
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-6 h-6 text-white shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-semibold text-white">Organization Type</span>
                    <span className="text-base font-normal text-white">{labelOf(ORG_TYPE_OPTIONS, form.organizationType)}</span>
                  </div>
                </div>
              )}
              {(form.streetAddress || form.city || form.state || form.zipCode) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-6 h-6 text-white shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-semibold text-white">Location</span>
                    <span className="text-base font-normal text-white">
                      {[form.streetAddress, form.city, form.state, form.zipCode].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              )}
              {form.conference && (
                <div className="flex items-start gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/icon-help.svg" alt="" width={24} height={24} className="shrink-0 mt-0.5 opacity-80" />
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-semibold text-white">Conference\League</span>
                    <span className="text-base font-normal text-white">{form.conference}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Completion checklist card */}
          <div className="rounded-[8px] p-6 bg-[rgba(255,255,255,0.06)] flex flex-col gap-4">
            <h3 className="font-display font-black text-[28px] uppercase text-white leading-none">
              Completion Checklist
            </h3>
            <div className="flex flex-col gap-3">
              {CHECKLIST.map((item) => {
                const done = item.done(form, !!logoUrl);
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Circle className="w-5 h-5 text-white shrink-0" />
                    )}
                    <span className={done ? "text-sm text-success line-through" : "text-sm text-white"}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <WizardFooter
        onSaveExit={() => {}}
        primaryLabel={isSubmitting ? "Saving…" : "Next"}
        onPrimary={handleNext}
        primaryDisabled={isSubmitting}
      />
    </div>
  );
}
