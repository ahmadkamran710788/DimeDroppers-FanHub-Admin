import * as yup from "yup";

export const campaignTierSchema = yup.object({
  title: yup.string().trim().required("Campaign title is required"),
  description: yup.string().trim().max(160, "Keep the description under 160 characters"),
  amount: yup
    .string()
    .trim()
    .required("Amount is required")
    .matches(/^\d+(\.\d{1,2})?$/, "Enter an amount like 10 or 12.50"),
  tickets: yup.number().integer().min(1, "At least 1 ticket").required(),
});

export const createCampaignSchema = yup.object({
  tiers: yup.array().of(campaignTierSchema).min(1, "Add at least one campaign"),
});
