import * as yup from "yup";

export const MESSAGE_MAX = 5000;

export const contactSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  message: yup
    .string()
    .trim()
    .required("Message is required")
    .max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX} characters`),
});
