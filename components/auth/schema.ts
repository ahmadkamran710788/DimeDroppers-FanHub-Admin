import * as yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js";

export const signInSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup.string().required("Password is required"),
});

export const signUpSchema = yup.object({
  name: yup.string().required("Organization name is required"),
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  phone: yup
    .string()
    .required("Phone is required")
    .test("us-phone", "Enter a valid US phone number", (v) => !!v && isValidPhoneNumber(v, "US")),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});
