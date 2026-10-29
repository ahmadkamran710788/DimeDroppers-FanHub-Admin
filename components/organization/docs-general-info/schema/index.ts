import * as yup from "yup";

// The API takes a title of up to 255 characters; the description has no limit there, so we keep one
// that reads well in the app.
export const TITLE_MAX = 255;
export const DESCRIPTION_MAX = 10000;

export const noteSchema = yup.object({
  title: yup.string().trim().required("Title is required").max(TITLE_MAX, `Keep it under ${TITLE_MAX} characters`),
  description: yup
    .string()
    .trim()
    .required("Description is required")
    .max(DESCRIPTION_MAX, `Keep it under ${DESCRIPTION_MAX} characters`),
});
