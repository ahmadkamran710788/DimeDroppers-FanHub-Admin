import * as yup from "yup";

const phone = yup
  .string()
  .test("is-complete", "Enter a 10-digit phone number", (v) => !v || v.replace(/\D/g, "").length === 10);

// Same limits as the API (POST / PATCH /fanhub/org/roster/teams/:schoolTeamId/players/:playerId/parents).
const nameFields = {
  firstName: yup.string().trim().required("First name is required").max(100, "Up to 100 characters"),
  lastName: yup.string().trim().max(100, "Up to 100 characters"),
  phone,
};

// Adding sends the invite straight after, so it needs the player and the email.
export const addParentSchema = yup.object({
  ...nameFields,
  playerId: yup.string().required("Choose the player"),
  email: yup.string().trim().required("Email is required").email("Enter a valid email address"),
});

export const editParentSchema = yup.object({
  ...nameFields,
  email: yup.string().trim().email("Enter a valid email address"),
});
