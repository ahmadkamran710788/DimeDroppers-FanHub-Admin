import * as yup from "yup";

// Add / rename a sport (department).
export const sportSchema = yup.object({
  name: yup.string().trim().required("Activity name is required").max(80, "Keep the activity name under 80 characters"),
});
