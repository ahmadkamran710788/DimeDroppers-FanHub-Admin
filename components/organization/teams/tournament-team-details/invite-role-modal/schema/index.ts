import * as yup from "yup";

export const inviteRoleSchema = yup.object({
  role: yup.string().required("Choose a role"),
  email: yup.string().trim().required("Email is required").email("Enter a valid email address"),
  playerId: yup.string().when("role", {
    is: (r: string) => r === "PLAYER" || r === "PARENT",
    then: (s) => s.required("Choose the player"),
  }),
});
