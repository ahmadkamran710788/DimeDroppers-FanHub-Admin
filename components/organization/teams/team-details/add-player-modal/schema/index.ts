import * as yup from "yup";

// Same limits as the API (POST / PATCH /fanhub/org/roster/teams/:schoolTeamId/players).
export const addPlayerSchema = yup.object({
  firstName: yup.string().trim().required("First name is required").max(100, "Up to 100 characters"),
  lastName: yup.string().trim().max(100, "Up to 100 characters"),
  number: yup.string().trim().max(10, "Up to 10 characters"),
});

// Editing also covers what the add call doesn't take: position, email and phone.
export const editPlayerSchema = addPlayerSchema.shape({
  position: yup.string().trim().max(50, "Up to 50 characters"),
  email: yup.string().trim().email("Enter a valid email address"),
  phone: yup
    .string()
    .test("is-complete", "Enter a 10-digit phone number", (v) => !v || v.replace(/\D/g, "").length === 10),
});
