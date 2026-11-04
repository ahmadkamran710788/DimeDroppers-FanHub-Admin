import type { PlayerRecognition, PlayerTemplate } from "@/components/organization/recognition/player-card";
import type { RecognitionTemplate } from "@/components/organization/recognition/recognitions-data";
import type { AwardBadge, Recognition, RecognitionBody, RecognitionStatus, RecognitionTemplateKey } from "@/utils/types/recognition";

// Between the panel's names and the recognitions API's keys (FANHUB_RECOGNITION_TEMPLATES_AND_RULES.md).

const TEMPLATE_KEY: Partial<Record<PlayerTemplate, RecognitionTemplateKey>> = { Game: "PLAYER_GAME", Profile: "PLAYER_PROFILE" };

export const templateKeyOf = (t: PlayerTemplate) => TEMPLATE_KEY[t];

export const playerTemplateOf = (key: RecognitionTemplateKey): PlayerTemplate => (key === "PLAYER_GAME" ? "Game" : "Profile");

// "Player of the Game" ↔ "PLAYER_OF_THE_GAME".
export const badgeKeyOf = (label: RecognitionTemplate) => label.toUpperCase().replace(/ /g, "_") as AwardBadge;

export const badgeLabelOf = (key: AwardBadge) =>
  key
    .toLowerCase()
    .split("_")
    .map((w, i) => (i > 0 && ["of", "the"].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ") as RecognitionTemplate;

// "PARENT" → "Parent"; titles like "Head Coach" stay as they are.
export const roleLabelOf = (role: string) => (role === role.toUpperCase() ? role.charAt(0) + role.slice(1).toLowerCase() : role);

// The card data of a recognition from the API.
export const cardOf = (r: Recognition): PlayerRecognition => ({
  player: {
    name: r.player.name,
    number: r.player.jerseyNumber && /^\d+$/.test(r.player.jerseyNumber) ? Number(r.player.jerseyNumber) : undefined,
    position: r.player.position ?? undefined,
    grade: r.player.grade ? `Grade ${r.player.grade}` : undefined,
    team: r.player.teamName ?? "",
  },
  game: r.game
    ? {
        date: r.game.startUtc,
        home: { name: r.game.home.name, logo: r.game.home.logoUrl ?? "" },
        away: { name: r.game.away.name, logo: r.game.away.logoUrl ?? "" },
      }
    : null,
  badge: badgeLabelOf(r.awardBadge),
  description: r.description,
});

// The full PATCH body of a recognition with a new status (PATCH replaces every editable field).
export const bodyOf = (r: Recognition, status: RecognitionStatus): RecognitionBody => ({
  category: r.category,
  template: r.template,
  status,
  awardBadge: r.awardBadge,
  description: r.description,
  recognizedBy: { type: r.recognizedBy.type, id: r.recognizedBy.id },
  player: { type: r.player.type, id: r.player.id },
  ...(r.scheduleEventId && { scheduleEventId: r.scheduleEventId }),
  ...(r.eventId && { eventId: r.eventId }),
});
