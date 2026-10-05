import * as yup from "yup";

// Jersey numbers already taken on the team are passed in so duplicates are rejected.
export const addPlayerSchema = (takenJerseys: number[]) =>
  yup.object({
    name: yup.string().trim().required("Player name is required"),
    email: yup.string().trim().required("Email is required").email("Enter a valid email address"),
    jersey: yup
      .string()
      .required("Jersey number is required")
      .matches(/^\d{1,2}$/, "Use a number from 0 to 99")
      .test("unique", "That jersey number is already taken", (v) => !v || !takenJerseys.includes(Number(v))),
    position: yup.string().required("Select a position"),
    graduated: yup.string().required("Select a graduation year"),
  });
