import * as yup from "yup";

// Adding a card: the name on it (Stripe's form has the numbers).
export const cardNameSchema = yup.object({
  holderName: yup.string().trim().required("Enter the name on the card").max(100, "Use 100 characters or fewer"),
});
