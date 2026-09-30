import * as yup from "yup";

// Accept / reject note (optional, max 500 characters — backend limit).
export const reviewNoteSchema = yup.object({
  reviewNote: yup.string().trim().max(500, "Keep the note under 500 characters"),
});
