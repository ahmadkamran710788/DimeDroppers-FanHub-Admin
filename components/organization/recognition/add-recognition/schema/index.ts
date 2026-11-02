import * as yup from "yup";
import { MESSAGE_MAX } from "@/components/organization/recognition/add-recognition/data";

export const customizeRecognitionSchema = yup.object({
  message: yup
    .string()
    .trim()
    .required("Write a recognition message")
    .max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX} characters`),
  giverId: yup.string().required("Choose the staff member or parent giving this shout-out"),
});
