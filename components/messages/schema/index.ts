import * as yup from "yup";

// New group: the API takes a title of up to 120 characters and an optional first message of up to 4000.
export const groupSchema = yup.object({
  title: yup.string().trim().required("Title is required").max(120, "Title must be 120 characters or fewer"),
  body: yup.string().max(4000, "Message must be 4000 characters or fewer"),
});
