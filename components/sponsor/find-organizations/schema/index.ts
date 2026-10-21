import * as yup from "yup";

// The search filters; sports and inventory are optional (none picked means any).
export const orgSearchSchema = yup.object({
  location: yup.string().trim().required("Enter a city or ZIP code"),
  radius: yup.string().required("Pick a radius"),
});
