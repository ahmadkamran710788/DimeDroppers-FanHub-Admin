import * as yup from "yup";

export const TITLE_MAX = 80;
export const COVERS_MAX = 300;
export const WHY_MAX = 300;

// Create / edit a need.
export const needSchema = yup.object({
  event: yup.string().required("Choose the event this need is for."),
  type: yup.string().required("Choose what kind of need this is."),
  title: yup
    .string()
    .trim()
    .required("Give the need a name sponsors will understand.")
    .max(TITLE_MAX, `Keep the name to ${TITLE_MAX} characters.`),
  covers: yup.string().trim().required("Say what this need pays for.").max(COVERS_MAX, `Keep it to ${COVERS_MAX} characters.`),
  why: yup.string().trim().max(WHY_MAX, `Keep it to ${WHY_MAX} characters.`),
  mccs: yup.array(yup.string()).min(1, "Allow at least one merchant category."),
});

// Record a sponsor's funding of a need.
export const fundingSchema = yup.object({
  sponsor: yup.string().trim().required("Enter the sponsor’s name."),
  amount: yup
    .string()
    .required("Enter an amount above $0.")
    .test("is-positive", "Enter an amount above $0.", (v) => Number(v) > 0),
});
