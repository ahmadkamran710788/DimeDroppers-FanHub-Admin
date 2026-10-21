import * as yup from "yup";

export const addTeamSchema = yup.object({
  teamName: yup.string().trim().required("Team name is required").max(120, "Keep the team name under 120 characters"),
  level: yup.string().required("Level is required"),
  sport: yup.string().required("Activity is required"),
  gender: yup.string().required("Gender is required"),
});
