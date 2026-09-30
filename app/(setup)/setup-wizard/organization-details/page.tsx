"use client";

import CheckCircle from "@/components/common/check-circle";
import SectionCard from "@/components/common/section-card";
import WizardFooter from "@/components/common/wizard-footer";
import BrandingFields from "@/components/organization/branding-fields";
import ContactFields from "@/components/organization/contact-fields";
import DescriptionField from "@/components/organization/description-field";
import LocationFields from "@/components/organization/location-fields";
import OrgTeamFields from "@/components/organization/org-team-fields";
import SocialFields from "@/components/organization/social-fields";
import SportLevelFields from "@/components/organization/sport-level-fields";
import type { OrgFormState } from "@/components/organization/form";
import PreviewCard from "@/components/organization/preview-card";
import { useOrganizationForm } from "@/components/organization/use-organization-form";
import { routes } from "@/utils/routes";
import { Circle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type ChecklistItem = {
  label: string;
  done: (f: OrgFormState, logoUploaded: boolean) => boolean;
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
      logoUploaded || f.primaryColor !== "#000000" || f.secondaryColor !== "#000000" || f.accentColor !== "#231F20",
  },
];

export default function OrganizationDetailsPage() {
  const router = useRouter();
  const org = useOrganizationForm();
  const { form, logoUrl, saving, savedSchool } = org;

  const handleNext = async () => {
    // Setup is this one step: once saved, the organization lives on the Profile page.
    if (await org.save()) router.push(routes.ui.profile);
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
          LET&apos;S SET UP YOUR ORGANIZATION
        </h2>
        <p className="text-base text-white/80">Tell us about your organization and team to create your Fan Hub.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        {/* LEFT — form sections */}
        <div className="flex flex-col gap-6 lg:gap-10 flex-1 min-w-0">
          <SectionCard title="Organization & Team Info">
            <OrgTeamFields {...org} />
            <SportLevelFields {...org} />
            <LocationFields {...org} />
            <DescriptionField {...org} />
          </SectionCard>

          <SectionCard title="Contact Information">
            <ContactFields {...org} />
          </SectionCard>

          <SectionCard title="Social Networks (optional)">
            <SocialFields {...org} />
          </SectionCard>

          <SectionCard title="Brand Basics (optional)" description="Apply brand colors for your page to make it with a unique look.">
            <BrandingFields {...org} existingLogoUrl={savedSchool?.logoUrl ?? undefined} onLogo={org.setLogo} />
          </SectionCard>
        </div>

        {/* RIGHT — looks good / preview / checklist */}
        <div className="w-full lg:w-[480px] lg:shrink-0 flex flex-col gap-6">
          <div className="rounded-[8px] p-6 bg-[rgba(101,193,98,0.08)] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-success shrink-0" />
              <h3 className="text-2xl font-bold text-success">Looks Good!</h3>
            </div>
            <p className="text-sm text-white/80">
              {"You're off to a great start. Once you complete all required fields, save to finish setting up your Fan Hub."}
            </p>
          </div>

          <PreviewCard form={form} logoUrl={logoUrl} />

          <div className="rounded-[8px] p-6 bg-[rgba(255,255,255,0.06)] flex flex-col gap-4">
            <h3 className="font-display font-black text-[28px] uppercase text-white leading-none">Completion Checklist</h3>
            <div className="flex flex-col gap-3">
              {CHECKLIST.map((item) => {
                const done = item.done(form, !!logoUrl);
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    {done ? <CheckCircle size={20} /> : <Circle className="w-5 h-5 text-white shrink-0" />}
                    <span className={done ? "text-sm text-success line-through" : "text-sm text-white"}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <WizardFooter
        withSidebar={false}
        primaryLabel={saving ? "Saving…" : "Save & Continue"}
        onPrimary={handleNext}
        primaryDisabled={saving}
      />
    </div>
  );
}
