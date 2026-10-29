import * as yup from "yup";

// Editing a draft's email: the limits PATCH /drafts/:id accepts (both trimmed).
export const draftEditSchema = yup.object({
  subject: yup.string().trim().required("Add a subject").max(90, "Keep the subject under 90 characters"),
  body: yup.string().trim().required("The email can't be empty").max(5000, "Keep the email under 5,000 characters"),
});
