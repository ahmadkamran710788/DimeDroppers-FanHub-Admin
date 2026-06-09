"use client";

import CheckCircle from "@/components/common/CheckCircle";
import ColorPicker from "@/components/common/ColorPicker";
import FileUpload from "@/components/common/FileUpload";
import Input from "@/components/common/Input";
import SectionCard from "@/components/common/SectionCard";
import Select from "@/components/common/Select";
import StepIndicator from "@/components/common/StepIndicator";
import Textarea from "@/components/common/Textarea";
import WizardFooter from "@/components/common/WizardFooter";
import { validateAndSetErrors } from "@/utils/validation";
import { routes } from "@/utils/routes";
import { Circle, MapPin, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import * as yup from "yup";

const schema = yup.object({
  organizationName: yup.string().required("Organization name is required"),
  teamName: yup.string().required("Team name is required"),
  level: yup.string().required("Level is required"),
  sport: yup.string().required("Sport is required"),
  location: yup.string().required("Location is required"),
  conference: yup.string().required("Conference/League is required"),
  primaryAudience: yup.string().required("Primary audience is required"),
  description: yup.string().required("Description is required").max(250, "Max 250 characters"),
  contactName: yup.string().required("Contact name is required"),
  phone: yup.string().required("Phone is required"),
  email: yup.string().required("Email is required").email("Enter a valid email"),
  website: yup.string().required("Website is required").url("Enter a valid URL"),
});

const LEVEL_OPTIONS = [
  { label: "High School", value: "high-school" },
  { label: "Middle School", value: "middle-school" },
  { label: "College", value: "college" },
  { label: "Youth", value: "youth" },
  { label: "Professional", value: "professional" },
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

const AUDIENCE_OPTIONS = [
  { label: "Students, Parents & Families", value: "students-parents-families" },
  { label: "Students Only", value: "students" },
  { label: "General Public", value: "general-public" },
  { label: "Alumni & Community", value: "alumni-community" },
];

type FormState = {
  organizationName: string;
  teamName: string;
  level: string;
  sport: string;
  location: string;
  conference: string;
  primaryAudience: string;
  description: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

const INITIAL: FormState = {
  organizationName: "",
  teamName: "",
  level: "",
  sport: "",
  location: "",
  conference: "",
  primaryAudience: "",
  description: "",
  contactName: "",
  phone: "",
  email: "",
  website: "",
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
  { label: "Team Name", done: (f) => !!f.teamName },
  { label: "Sport", done: (f) => !!f.sport },
  { label: "Level", done: (f) => !!f.level },
  { label: "Location", done: (f) => !!f.location },
  { label: "Conference\\League", done: (f) => !!f.conference },
  { label: "Description", done: (f) => !!f.description },
  { label: "Primary Audience", done: (f) => !!f.primaryAudience },
  { label: "Contact Information", done: (f) => !!(f.contactName && f.phone && f.email && f.website) },
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

export default function HubDetailsPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setColor = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // The form stores option slugs (e.g. "high-school"); the API expects the human label
  // (e.g. "High School"). Fall back to the raw value if no matching option is found.
  const labelOf = (options: { label: string; value: string }[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  const handleNext = async () => {
    const valid = await validateAndSetErrors(schema as yup.ObjectSchema<Record<string, unknown>>, form, setErrors);
    if (!valid) return;

    const body = new FormData();
    body.append("name", form.organizationName);
    body.append("teamName", form.teamName);
    body.append("level", labelOf(LEVEL_OPTIONS, form.level));
    body.append("sportsType", form.sport);
    body.append("address", form.location);
    body.append("league", form.conference);
    body.append("primaryAudience", labelOf(AUDIENCE_OPTIONS, form.primaryAudience));
    body.append("description", form.description);
    body.append("contactName", form.contactName);
    body.append("contactPhone", form.phone);
    body.append("contactEmail", form.email);
    body.append("website", form.website);
    body.append("colors", form.primaryColor);
    body.append("secondaryColor", form.secondaryColor);
    body.append("accentColor", form.accentColor);
    if (logoFile) body.append("logo", logoFile);

    setIsSubmitting(true);
    try {
      const res = await fetch(routes.api.proxyCreateSchool, { method: "POST", body });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.message || "Failed to create school. Please try again.");
        return;
      }

      const schoolId = json?.data?.[0]?.school?.id;
      if (schoolId) sessionStorage.setItem("fanhub:schoolId", String(schoolId));

      toast.success("School created");
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
        <h2 className="font-display font-black text-[56px] uppercase text-white leading-none">
          Configure Hub Details
        </h2>
        <p className="text-base text-white/80">
          Tell us about your organization and team to create your Fan Hub.
        </p>
      </div>

      <div className="flex gap-10 items-start">
        {/* LEFT — form sections */}
        <div className="flex flex-col gap-10 flex-1 min-w-0">
          <SectionCard title="Organization & Team Info">
            <div className="grid grid-cols-2 gap-6">
              <Input label="Organization Name" name="organizationName" value={form.organizationName} onChange={set("organizationName")} placeholder="Twin Lakes Academy Middle School" error={errors.organizationName} className="col-span-2" />
              <Input label="Team Name" name="teamName" value={form.teamName} onChange={set("teamName")} placeholder="TLAM" error={errors.teamName} className="col-span-2" />
              <Select label="Level" name="level" value={form.level} onChange={set("level")} options={LEVEL_OPTIONS} placeholder="Select level" error={errors.level} />
              <Select label="Sport" name="sport" value={form.sport} onChange={set("sport")} options={SPORT_OPTIONS} placeholder="Select sport" error={errors.sport} />
              <Input label="Location" name="location" value={form.location} onChange={set("location")} placeholder="Fort Lauderdale, FL" icon={<MapPin className="w-5 h-5" />} error={errors.location} />
              <Input label="Conference/League" name="conference" value={form.conference} onChange={set("conference")} placeholder="Eastern Lakes Conference" icon={<MapPin className="w-5 h-5" />} error={errors.conference} />
              <Select label="Primary Audience" name="primaryAudience" value={form.primaryAudience} onChange={set("primaryAudience")} options={AUDIENCE_OPTIONS} placeholder="Select audience" icon={<Users className="w-5 h-5" />} error={errors.primaryAudience} className="col-span-2" />
              <Textarea label="Description" name="description" value={form.description} onChange={set("description")} maxLength={250} placeholder="The Official fan hub for your team..." error={errors.description} className="col-span-2" />
            </div>
          </SectionCard>

          <SectionCard title="Contact Information">
            <div className="grid grid-cols-2 gap-6">
              <Input label="Contact Name" name="contactName" value={form.contactName} onChange={set("contactName")} placeholder="John Doe" error={errors.contactName} />
              <Input label="Phone" name="phone" value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" type="tel" error={errors.phone} />
              <Input label="Email" name="email" value={form.email} onChange={set("email")} placeholder="johndoe@tlam.com" type="email" error={errors.email} />
              <Input label="Website" name="website" value={form.website} onChange={set("website")} placeholder="https://www.tlam.com" type="url" error={errors.website} />
            </div>
          </SectionCard>

          <SectionCard title="Brand Basics (optional)" description="Apply brand colors for your page to make it with a unique look.">
            <div className="grid grid-cols-3 gap-6">
              <ColorPicker label="Primary Color" name="primaryColor" value={form.primaryColor} onChange={setColor("primaryColor")} />
              <ColorPicker label="Secondary Color" name="secondaryColor" value={form.secondaryColor} onChange={setColor("secondaryColor")} />
              <ColorPicker label="Accent Color" name="accentColor" value={form.accentColor} onChange={setColor("accentColor")} />
            </div>
            <FileUpload
              label="Team Logo"
              variant="image"
              onFile={(file, url) => {
                setLogoFile(file);
                setLogoUrl(url ?? null);
              }}
              onClear={() => {
                setLogoFile(null);
                setLogoUrl(null);
              }}
            />
          </SectionCard>
        </div>

        {/* RIGHT — looks good / preview / checklist */}
        <div className="w-[480px] shrink-0 flex flex-col gap-6">
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
              {form.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-6 h-6 text-white shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-semibold text-white">Location</span>
                    <span className="text-base font-normal text-white">{form.location}</span>
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
              {form.primaryAudience && (
                <div className="flex items-start gap-2">
                  <Users className="w-6 h-6 text-white shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-semibold text-white">Primary Audience</span>
                    <span className="text-base font-normal text-white">{AUDIENCE_OPTIONS.find((o) => o.value === form.primaryAudience)?.label}</span>
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
