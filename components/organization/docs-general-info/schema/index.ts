import * as yup from "yup";

export const NAME_MAX = 80;

export const documentSchema = yup.object({
  name: yup.string().trim().required("Document name is required").max(NAME_MAX, `Keep it under ${NAME_MAX} characters`),
  fileName: yup.string().required("Upload a PDF"),
});
