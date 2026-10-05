import * as yup from "yup";

export const addStaffSchema = yup.object({
  role: yup.string().required("Choose head coach or assistant coach"),
  name: yup.string().trim().required("Name is required"),
  email: yup.string().trim().required("Email is required").email("Enter a valid email address"),
  phone: yup
    .string()
    .test("is-complete", "Enter a 10-digit phone number", (v) => !v || v.replace(/\D/g, "").length === 10),
});
