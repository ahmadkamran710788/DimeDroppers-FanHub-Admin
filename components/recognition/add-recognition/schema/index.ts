import * as yup from "yup";
import { MESSAGE_MAX } from "@/components/recognition/add-recognition/data";

export const customizeRecognitionSchema = yup.object({
  gameId: yup.string().required("Select the game or event"),
  recipientId: yup.string().required("Select who you are recognizing"),
  message: yup
    .string()
    .trim()
    .required("Write a recognition message")
    .max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX} characters`),
  recognizedBy: yup.string().trim().required("Enter who is giving the recognition"),
  role: yup.string().trim().required("Enter their role"),
});
