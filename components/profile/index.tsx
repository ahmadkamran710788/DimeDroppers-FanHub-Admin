"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Building2, CircleCheck, Eye, FileText, MapPin, Palette, Phone, Share2, Trophy } from "lucide-react";
import Button from "@/components/common/button";
import EditSectionModal from "@/components/profile/edit-section-modal";
import DetailRows from "@/components/profile/detail-rows";
import ProfileSection from "@/components/profile/profile-section";
import BrandingFields from "@/components/organization/branding-fields";
import ContactFields from "@/components/organization/contact-fields";
import DescriptionField from "@/components/organization/description-field";
import LocationFields from "@/components/organization/location-fields";
import OrgTeamFields from "@/components/organization/org-team-fields";
import SocialFields, { SOCIAL_FIELDS } from "@/components/organization/social-fields";
import SportLevelFields from "@/components/organization/sport-level-fields";
import {
  EVENT_TYPE_OPTIONS,
  LEVEL_OPTIONS,
  ORG_TYPE_OPTIONS,
  SPORT_OPTIONS,
  US_STATE_OPTIONS,
  isClubTeam,
  labelOf,
  type FieldGroupProps,
  type OrgFormState,
} from "@/components/organization/form";
import PreviewCard from "@/components/organization/preview-card";
import { useOrganizationForm } from "@/components/organization/use-organization-form";
import { getResumeStep, isSetupComplete } from "@/utils/fanhub/get-resume-step";

type SectionKey = "orgTeam" | "sportLevel" | "location" | "description" | "contact" | "social" | "branding";

interface SectionDef {
  title: string;
  icon: ReactNode;
  // Fields validated when this section's dialog saves.
  fields: (keyof OrgFormState)[];
}

const SECTIONS: Record<SectionKey, SectionDef> = {
  orgTeam: {
    title: "Organization & Team Information",
    icon: <Building2 className="size-5" />,
    fields: ["organizationName", "organizationType", "eventType", "teamName"],
  },
  sportLevel: { title: "Sport & Level", icon: <Trophy className="size-5" />, fields: ["sport", "level"] },
  location: {
    title: "Location",
    icon: <MapPin className="size-5" />,
    fields: ["streetAddress", "city", "state", "zipCode", "conference"],
  },
  description: { title: "Description", icon: <FileText className="size-5" />, fields: ["description"] },
  contact: {
    title: "Contact Information",
    icon: <Phone className="size-5" />,
    fields: ["contactName", "contactPosition", "phone", "email", "website"],
  },
  social: {
    title: "Social Networks (Optional)",
    icon: <Share2 className="size-5" />,
    fields: ["facebookUrl", "instagramUrl", "xUrl", "youtubeUrl", "tiktokUrl"],
  },
  branding: { title: "Branding (Optional)", icon: <Palette className="size-5" />, fields: [] },
};

const SECTION_ORDER: SectionKey[] = ["orgTeam", "sportLevel", "location", "description", "contact", "social", "branding"];

const formatPhone = (digits: string) =>
  /^\d{10}$/.test(digits) ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : digits;

// Organization Profile: the saved organization details, each section editable in a dialog,
// beside the Fan Hub preview. Replaces the Setup Wizard once first-time setup is done.
export default function ProfilePage() {
  const org = useOrganizationForm();
  const { form, logoUrl, saving, savedSchool } = org;
  const [editing, setEditing] = useState<SectionKey | null>(null);
  const complete = isSetupComplete(savedSchool);

  const fieldProps: FieldGroupProps = org;

  const closeEditor = () => {
    org.reset();
    setEditing(null);
  };

  const saveSection = async () => {
    if (!editing) return;
    if (await org.save(SECTIONS[editing].fields)) setEditing(null);
  };

  const isClub = isClubTeam(form.organizationType);

  const content: Record<SectionKey, ReactNode> = {
    orgTeam: (
      <DetailRows
        rows={[
          { label: "Organization Name", value: form.organizationName },
          { label: "Organization Type", value: form.organizationType && labelOf(ORG_TYPE_OPTIONS, form.organizationType) },
          // Event Type and Team Name only apply to club teams.
          ...(isClub
            ? [
                { label: "Event Type", value: form.eventType && labelOf(EVENT_TYPE_OPTIONS, form.eventType) },
                { label: "Team Name", value: form.teamName },
              ]
            : []),
        ]}
      />
    ),
    sportLevel: (
      <DetailRows
        rows={[
          { label: "Sport", value: form.sport && labelOf(SPORT_OPTIONS, form.sport) },
          { label: "Level", value: form.level && labelOf(LEVEL_OPTIONS, form.level) },
        ]}
      />
    ),
    location: (
      <DetailRows
        rows={[
          { label: "Street Address", value: form.streetAddress },
          { label: "City", value: form.city },
          { label: "State", value: form.state && labelOf(US_STATE_OPTIONS, form.state) },
          { label: "Zip Code", value: form.zipCode },
          { label: "Conference/Division", value: form.conference },
        ]}
      />
    ),
    description: <p className="text-sm text-white/90 whitespace-pre-line">{form.description || "—"}</p>,
    contact: (
      <DetailRows
        rows={[
          { label: "Contact Name", value: form.contactName },
          { label: "Position", value: form.contactPosition },
          { label: "Phone", value: formatPhone(form.phone) },
          { label: "Email", value: form.email },
          { label: "Website", value: form.website },
        ]}
      />
    ),
    social: SOCIAL_FIELDS.some(({ field }) => form[field]) ? (
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {SOCIAL_FIELDS.filter(({ field }) => form[field]).map(({ field, label, icon }) => (
          <a
            key={field}
            href={form[field]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white underline underline-offset-2 hover:text-white/80 min-w-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon} alt={label} className="size-6 shrink-0" />
            <span className="truncate max-w-[180px]">{form[field]}</span>
          </a>
        ))}
      </div>
    ) : (
      <p className="text-sm text-white/60">No social links added.</p>
    ),
    branding: (
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-white/70">Team Logo</span>
          <div className="size-24 rounded-[8px] border border-white/20 bg-black/40 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Team logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-white/50">No logo</span>
            )}
          </div>
        </div>
        {(
          [
            ["Primary Color", form.primaryColor],
            ["Secondary Color", form.secondaryColor],
            ["Accent Color", form.accentColor],
          ] as const
        ).map(([label, color]) => (
          <div key={label} className="flex flex-col gap-2">
            <span className="text-sm text-white/70">{label}</span>
            <span className="flex items-center gap-2 text-sm text-white">
              <span className="size-8 rounded-[6px] border border-white/30" style={{ background: color }} />
              {color.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    ),
  };

  const editor: Record<SectionKey, ReactNode> = {
    orgTeam: <OrgTeamFields {...fieldProps} />,
    sportLevel: <SportLevelFields {...fieldProps} />,
    location: <LocationFields {...fieldProps} />,
    description: <DescriptionField {...fieldProps} />,
    contact: <ContactFields {...fieldProps} />,
    social: <SocialFields {...fieldProps} />,
    branding: <BrandingFields {...fieldProps} existingLogoUrl={savedSchool?.logoUrl ?? undefined} onLogo={org.setLogo} />,
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[48px] text-white leading-none">
            Organization Profile
          </h2>
          <p className="text-base text-white/80">
            Manage your organization information. This will be shown on your Fan Hub for fans to view.
          </p>
        </div>
        <Button
          variant="outline"
          label="View Public Page"
          icon={<Eye className="size-5" />}
          onClick={() => toast("Coming soon.")}
          className="shrink-0"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-8 items-start">
        <div className="flex flex-col gap-4">
          {/* Sport & Level only applies to club teams. */}
          {SECTION_ORDER.filter((key) => key !== "sportLevel" || isClub).map((key) => (
            <ProfileSection key={key} icon={SECTIONS[key].icon} title={SECTIONS[key].title} onEdit={() => setEditing(key)}>
              {content[key]}
            </ProfileSection>
          ))}
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-0">
          <PreviewCard
            form={form}
            logoUrl={logoUrl}
            title="Preview (Your Fan Hub)"
            subtitle="This is how your organization will look to fans."
          />
          {complete ? (
            <div className="rounded-[8px] p-4 flex items-start gap-3 border border-success/50 bg-success/10">
              <CircleCheck className="size-7 shrink-0 fill-success text-[#0E2A12]" strokeWidth={2.5} />
              <div className="flex flex-col gap-1">
                <span className="text-base font-semibold text-success">Profile Complete!</span>
                <span className="text-sm text-white/80">
                  Your organization profile is ready and will be shown to fans on your Fan Hub.
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-[8px] p-4 flex flex-col gap-3 border border-white/20 bg-white/5">
              <span className="text-base font-semibold text-white">Finish setting up your Fan Hub</span>
              <span className="text-sm text-white/70">A few setup steps are still open.</span>
              <Link
                href={getResumeStep()}
                className="self-start h-10 px-4 rounded-[8px] flex items-center text-sm font-medium text-white"
                style={{ background: "var(--gradient-cta)" }}
              >
                Continue setup
              </Link>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EditSectionModal
          isOpen
          title={SECTIONS[editing].title}
          saving={saving}
          onCancel={closeEditor}
          onSave={saveSection}
        >
          {editor[editing]}
        </EditSectionModal>
      )}
    </div>
  );
}
