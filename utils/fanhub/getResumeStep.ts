import { routes } from "@/utils/routes";
import type { SavedSchool } from "@/utils/types/school";

const FEATURE_LINK_FIELDS: (keyof SavedSchool)[] = [
  "gofanSchoolPage",
  "nfhsNetworkLink",
  "partnerOffersLink",
  "highlightsStatsLink",
  "supportTeamLink",
  "shoutOutWallLink",
  "teamStoresLink",
  "recordGameLink",
  "scoreGameLink",
  "predictLink",
  "voteLink",
  "arcadeLink",
  "challengesQuestsLink",
  "fanWallLink",
  "chatLink",
];

/**
 * Returns the wizard URL the user should land on based on how far they
 * previously progressed. Falls back to Step 1 when there is no saved data.
 */
export function getResumeStep(school: SavedSchool | null): string {
  if (!school?.name) return routes.ui.setupWizard.organizationDetails;

  const hasSchedule = (school.scheduleEvents?.length ?? 0) > 0;
  if (!hasSchedule) return routes.ui.setupWizard.importSchedule;

  const hasActivations = FEATURE_LINK_FIELDS.some(
    (f) => typeof school[f] === "string" && (school[f] as string).length > 0
  );
  if (!hasActivations) return routes.ui.setupWizard.chooseActivations;

  return routes.ui.setupWizard.reviewPublish;
}
