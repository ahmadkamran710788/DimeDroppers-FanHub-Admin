import * as yup from "yup";

// Step 2 of the claim wizard — the organization is already picked in step 1, so here we validate the
// person's title (their role at the organization) and their email.
export const claimDetailsSchema = yup.object({
  title: yup.string().required("Please select your title"),
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
});
