import { routes } from "@/utils/routes";
import type { SavedSchool } from "@/utils/types/school";

/**
 * First-time setup = the Organization Details step only. It counts as complete once the
 * organization is saved (it has a name). There is no backend "setup completed" flag yet.
 */
export function isSetupComplete(school: SavedSchool | null): boolean {
  return !!school?.name;
}

/** Where to send a user after sign-in / sign-up: Profile once set up, else the setup step. */
export function getPostAuthRoute(school: SavedSchool | null): string {
  return isSetupComplete(school) ? routes.ui.profile : getResumeStep();
}

/** The setup step to (re)open. Setup is a single step: Organization Details. */
export function getResumeStep(): string {
  return routes.ui.setupWizard.organizationDetails;
}
