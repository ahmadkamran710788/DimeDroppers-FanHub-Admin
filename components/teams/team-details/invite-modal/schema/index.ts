import * as yup from "yup";

export const inviteSchema = yup.object({
  email: yup.string().trim().required("Email is required").email("Enter a valid email address"),
});
