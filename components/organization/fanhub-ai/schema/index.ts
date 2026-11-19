import * as yup from "yup";
import { MESSAGE_MAX_CHARS } from "@/components/organization/fanhub-ai/data";

// A message to the agent: the limits POST /sessions/:id/messages accepts (trimmed, 1–1000 characters).
export const agentMessageSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required("Type a message")
    .max(MESSAGE_MAX_CHARS, `Keep messages under ${MESSAGE_MAX_CHARS.toLocaleString("en-US")} characters`),
});
