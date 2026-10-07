import * as yup from "yup";

export const addTeamSchema = yup.object({
  teamName: yup.string().trim().required("Team name is required"),
  nickname: yup.string().trim(),
  level: yup.string().required("Level is required"),
  sport: yup.string().required("Sport is required"),
  gender: yup.string().required("Gender is required"),
});
