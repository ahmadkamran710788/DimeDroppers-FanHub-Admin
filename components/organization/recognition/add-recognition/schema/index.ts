import * as yup from "yup";
import { MESSAGE_MAX } from "@/components/organization/recognition/add-recognition/data";

// The rules of FANHUB_RECOGNITION_TEMPLATES_AND_RULES: every template needs Recognized By, the player and the
// description; "Game" also the game (and, for a school, which of its teams), "Profile" the team. When editing
// keeps the recognition's people, only the description is checked here.
export const customizeRecognitionSchema = (rules: {
  needsGame: boolean;
  needsTeam: boolean;
  needsSide: boolean;
  needsPeople: boolean;
}) =>
  yup.object({
    gameId: rules.needsGame ? yup.string().required("Choose the game") : yup.string(),
    side: rules.needsSide ? yup.string().required("Choose the team") : yup.string(),
    teamId: rules.needsTeam ? yup.string().required("Choose the team") : yup.string(),
    giverId: rules.needsPeople ? yup.string().required("Choose the staff member or parent giving this recognition") : yup.string(),
    playerId: rules.needsPeople ? yup.string().required("Choose the player") : yup.string(),
    message: yup
      .string()
      .trim()
      .required("Write a recognition message")
      .max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX} characters`),
  });
