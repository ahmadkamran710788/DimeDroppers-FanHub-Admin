import { routes } from "@/utils/routes";
import type { SavedSchool } from "@/utils/types/school";

const filled = (...values: (string | null | undefined)[]) =>
  values.every((v) => !!v?.trim());

/**
 * First-time setup = the Organization Details step only. It counts as complete once every field
 * the setup form requires (orgSchema) is saved: the optional ones (conference, website, description,
 * social links, branding) don't count, and Event Type, Team Name, Sport and Level are only required
 * of a club team (saved as "Club Team"). The sign-up collects all of it, so a new organisation is
 * complete straight away. There is no backend "setup completed" flag yet.
 */
export function isSetupComplete(school: SavedSchool | null): boolean {
  if (!school) return false;
  const clubTeam = school.organizationType === "Club Team";
  return (
    (!clubTeam ||
      filled(
        school.eventType,
        school.teamName,
        school.sportsType,
        school.level,
      )) &&
    filled(
      school.name, // Organization Name
      school.organizationType, // Organization Type
      school.streetAddress, // Address
      school.city,
      school.state,
      school.zipCode,
      school.contactName, // Contact Information
      school.contactPosition,
      school.contactPhone,
      school.contactEmail,
    )
  );
}

/** Where to send a user after sign-in / sign-up: Profile once set up, else the setup step. */
export function getPostAuthRoute(school: SavedSchool | null): string {
  return isSetupComplete(school) ? routes.ui.profile : getResumeStep();
}

/** The setup step to (re)open. Setup is a single step: Organization Details. */
export function getResumeStep(): string {
  return routes.ui.setupWizard.organizationDetails;
}
