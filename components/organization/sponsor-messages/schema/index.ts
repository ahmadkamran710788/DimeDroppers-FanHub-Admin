import * as yup from "yup";
import { REPLY_MAX_CHARS } from "@/components/organization/sponsor-messages/data";

// A reply from the panel: the limits POST /threads/:id/reply accepts (trimmed).
export const threadReplySchema = yup.object({
  body: yup.string().trim().required("Write a reply").max(REPLY_MAX_CHARS, "Keep the reply under 5,000 characters"),
});
