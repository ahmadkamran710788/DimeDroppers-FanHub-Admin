import * as yup from "yup";

// One ticket type ("+ Add" block): title, description, amount and tickets per game.
export const ticketTypeSchema = yup.object({
  title: yup.string().trim().required("Ticket title is required").max(120, "Keep the title under 120 characters"),
  description: yup.string().trim().max(300, "Keep the description under 300 characters"),
  amount: yup
    .string()
    .trim()
    .required("Amount is required")
    .matches(/^\d+(\.\d{1,2})?$/, "Enter an amount like 10 or 12.50"),
  tickets: yup.number().integer().min(1, "At least 1 ticket").required(),
});

// The Create Campaign dialog: the campaign type (campaign title) and 1 to 20 ticket types.
export const campaignSchema = yup.object({
  title: yup.string().trim().required("Campaign type is required").max(200, "Keep the title under 200 characters"),
  types: yup.array().of(ticketTypeSchema).min(1, "Add at least one ticket").max(20, "A campaign can have up to 20 tickets"),
});
