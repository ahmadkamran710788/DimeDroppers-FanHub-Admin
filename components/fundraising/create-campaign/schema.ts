import * as yup from "yup";

export const DESCRIPTION_MAX = 250;

// "Your Impact" — what the campaign funds; any number can be picked.
export const IMPACT_OPTIONS = ["Meals", "Travel", "Tournament Fees"] as const;
export type CampaignImpact = (typeof IMPACT_OPTIONS)[number];

export const createCampaignSchema = yup.object({
  name: yup.string().trim().required("Campaign name is required"),
  teamId: yup.string().required("Select the team this campaign is for"),
  goal: yup
    .string()
    .required("Goal amount is required")
    .test("is-positive", "Enter a goal greater than $0", (v) => Number(v) > 0),
  startDate: yup.string().required("Start date is required"),
  endDate: yup
    .string()
    .required("End date is required")
    .test("is-after-start", "End date must be after the start date", function (endDate) {
      const { startDate } = this.parent;
      if (!startDate || !endDate) return true;
      return endDate > startDate;
    }),
  sponsorName: yup.string().trim(),
  impact: yup.array(yup.string().oneOf(IMPACT_OPTIONS)),
  description: yup.string().trim().max(DESCRIPTION_MAX, `Keep it under ${DESCRIPTION_MAX} characters`),
});
