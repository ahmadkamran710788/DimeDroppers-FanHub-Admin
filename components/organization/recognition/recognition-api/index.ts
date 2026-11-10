import { cardHexOf } from "@/components/organization/recognition/add-recognition/data";
import { PLAYER_TEMPLATES } from "@/components/organization/recognition/player-card";
import type { PlayerRecognition, PlayerTemplate } from "@/components/organization/recognition/player-card";
import type { RecognitionTemplate } from "@/components/organization/recognition/recognitions-data";
import type { AwardBadge, Recognition, RecognitionBody, RecognitionStatus, RecognitionTemplateKey } from "@/utils/types/recognition";

// Between the panel's names and the recognitions API's keys (FANHUB_RECOGNITION_TEMPLATES_AND_RULES.md).

const TEMPLATE_KEY: Partial<Record<PlayerTemplate, RecognitionTemplateKey>> = { Game: "PLAYER_GAME", Profile: "PLAYER_PROFILE" };

export const templateKeyOf = (t: PlayerTemplate) => TEMPLATE_KEY[t];

export const playerTemplateOf = (key: RecognitionTemplateKey): PlayerTemplate => (key === "PLAYER_GAME" ? "Game" : "Profile");

// A template's own card colour as a hex (its gradient's first stop): the hexColor sent when none is picked.
export const templateHexOf = (t: PlayerTemplate) => cardHexOf(PLAYER_TEMPLATES.find((p) => p.name === t)?.gradient ?? "") || "#2563EB";

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

// The one of a game's two sides that isn't `school`; undefined when that can't be told.
const opponentOf = (sides: string[], school?: string | null) => {
  const own = school?.trim().toUpperCase();
  if (!own) return undefined;
  const others = sides.filter((n) => n.trim().toUpperCase() !== own);
  return others.length === 1 ? others[0] : undefined;
};

// The card data of a recognition from the API.
// `orgName` stands in for the player's school when the API has none (to tell the opponent apart).
export const cardOf = (r: Recognition, orgName?: string): PlayerRecognition => ({
  player: {
    // A removed player can come back without a name.
    name: r.player.name || "Unknown player",
    number: r.player.jerseyNumber && /^\d+$/.test(r.player.jerseyNumber) ? Number(r.player.jerseyNumber) : undefined,
    position: r.player.position ?? undefined,
    grade: r.player.grade ? `Grade ${r.player.grade}` : undefined,
    team: r.player.teamName ?? "",
    sport: r.sport ?? undefined,
    school: r.schoolName ?? undefined,
    photo: r.player.fan?.profileUrl ?? undefined,
  },
  game: r.game
    ? {
        date: r.game.startUtc,
        home: { name: r.game.home.name, logo: r.game.home.logoUrl ?? "" },
        away: { name: r.game.away.name, logo: r.game.away.logoUrl ?? "" },
        // The side that isn't the player's school (the API's schoolName, else the organisation's name).
        opponent: opponentOf([r.game.home.name, r.game.away.name], r.schoolName || orgName),
      }
    : null,
  badge: badgeLabelOf(r.awardBadge),
  description: r.description,
  ...(r.period && { period: r.period }),
  // Who gave it, and when (from createdAt).
  recognizedBy: { name: r.recognizedBy.name || "Unknown", role: roleLabelOf(r.recognizedBy.role), at: r.createdAt },
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
  hexColor: r.hexColor || templateHexOf(playerTemplateOf(r.template)),
  ...(r.awardBadge === "ATHLETE_OF_THE_MONTH" && r.period && { period: r.period }),
});
