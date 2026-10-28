import * as yup from "yup";

export const DESCRIPTION_MAX = 250;

// Notifications show the title as the card body, which fits about 2 lines (~65 characters).
export const NAME_MAX = 60;

// "Purpose" — what the campaign funds; any number can be picked.
export const IMPACT_OPTIONS = ["Meals", "Travel", "Tournament Fees"] as const;
export type CampaignImpact = (typeof IMPACT_OPTIONS)[number];

export const createCampaignSchema = yup.object({
  name: yup.string().trim().required("Campaign name is required").max(NAME_MAX, `Keep the campaign name to ${NAME_MAX} characters`),
  teamId: yup.string().required("Select the team this campaign is for"),
  goal: yup
    .string()
    .required("Goal amount is required")
    .test("is-positive", "Enter a goal greater than $0", (v) => Number(v) > 0),
  startDate: yup.string().required("Start date is required"),
  endDate: yup
    .string()
    .required("End date is required")
    // A campaign runs through the end of its end date, so a one-day campaign is valid.
    .test("not-before-start", "End date can't be before the start date", function (endDate) {
      const { startDate } = this.parent;
      if (!startDate || !endDate) return true;
      return endDate >= startDate;
    }),
  sponsorName: yup.string().trim(),
  impact: yup.array(yup.string().oneOf(IMPACT_OPTIONS)),
  description: yup.string().trim().max(DESCRIPTION_MAX, `Keep it under ${DESCRIPTION_MAX} characters`),
});

// A tournament campaign raises for one team of an event (not a game, for now).
export const tournamentCampaignSchema = createCampaignSchema.shape({
  teamId: yup.string(),
  fanHubTeamId: yup.string().required("Select the team this campaign is for"),
});

// Editing a tournament campaign: its game and team are fixed, so neither is checked.
export const tournamentCampaignEditSchema = createCampaignSchema.shape({ teamId: yup.string() });
