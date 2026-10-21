import * as yup from "yup";

// Edit Team: the team name and the sport it belongs to; level and gender may be left empty (cleared).
export const editTeamSchema = yup.object({
  name: yup.string().trim().required("Team name is required").max(120, "Keep the team name under 120 characters"),
  sport: yup.string().required("Activity is required"),
  level: yup.string(),
  gender: yup.string(),
});
