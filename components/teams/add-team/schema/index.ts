import * as yup from "yup";

export const addTeamSchema = yup.object({
  teamName: yup.string().trim().required("Team name is required"),
  nickname: yup.string().trim(),
  level: yup.string().required("Level is required"),
  sport: yup.string().required("Sport is required"),
  gender: yup.string().required("Gender is required"),
  ageGroup: yup.string().trim(),
  season: yup.string().required("Season is required"),
  facilityName: yup.string().trim(),
  address1: yup.string().trim(),
  address2: yup.string().trim(),
  city: yup.string().trim(),
  state: yup.string().trim().max(2, "Use the 2-letter state code"),
  zip: yup
    .string()
    .trim()
    .matches(/^(\d{5}(-\d{4})?)?$/, "Enter a valid ZIP code"),
});
