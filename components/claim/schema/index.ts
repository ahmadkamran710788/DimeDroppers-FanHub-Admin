import * as yup from "yup";

export const claimSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  organizationId: yup.string().required("Please select an organization"),
});
