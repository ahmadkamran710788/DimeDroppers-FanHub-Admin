import * as yup from "yup";

export const inviteMemberSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
});
