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

// Sponsor sign-up, step 1: the person who manages sponsorships.
export const sponsorAccountSchema = yup.object({
  contact: yup.string().trim().required("Your full name is required"),
  email: yup
    .string()
    .trim()
    .required("Work email is required")
    .email("Enter a valid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Use 8 or more characters")
    .matches(/\d/, "Include at least one number"),
  // Optional: only checked once something is typed.
  phone: yup
    .string()
    .test("us-phone", "Enter a valid US phone number", (v) => !v || isValidPhoneNumber(v, "US")),
});

// Sponsor sign-up, step 2: the brand organizations see.
export const sponsorBrandSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Sponsor name is required")
    .max(80, "Keep the sponsor name under 80 characters"),
  category: yup.string().required("Choose a category"),
});
