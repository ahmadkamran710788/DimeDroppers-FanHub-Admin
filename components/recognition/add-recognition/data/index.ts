// SAMPLE DATA — there is no games, roster or recognitions endpoint yet. Feeds the
// Add Recognition wizard until the backend exposes games and people to recognize.

import { MUSTANGS, type RecognitionCategory } from "@/components/recognition/recognitions-data";

export interface RecognitionGame {
  id: string;
  label: string;
  // ISO date-time; omitted for season-long events.
  date?: string;
  opponent?: { name: string; logo: string };
}

export const SAMPLE_GAMES: RecognitionGame[] = [
  { id: "g-1", label: "TLAM vs Mandarin Mustangs", date: "2026-06-30T22:00:00", opponent: MUSTANGS },
  { id: "g-2", label: "TLAM vs Mandarin Mustangs", date: "2026-06-28T19:00:00", opponent: MUSTANGS },
  { id: "g-3", label: "Season 2026" },
];

export interface Recipient {
  id: string;
  name: string;
  // Jersey number (players only).
  number?: number;
}

export const SAMPLE_RECIPIENTS: Record<RecognitionCategory, Recipient[]> = {
  Player: [
    { id: "p-12", name: "Jordan Smith", number: 12 },
    { id: "p-23", name: "Marcus Lee", number: 23 },
    { id: "p-8", name: "Caleb Wright", number: 8 },
    { id: "p-5", name: "King Williams", number: 5 },
  ],
  Coach: [
    { id: "c-1", name: "Coach Rivera" },
    { id: "c-2", name: "Caleb Wright" },
  ],
  Parent: [
    { id: "pa-1", name: "Marcus Lee" },
    { id: "pa-2", name: "Maya R." },
  ],
  Sponsor: [
    { id: "s-1", name: "Dime Athletics" },
    { id: "s-2", name: "Subway" },
  ],
  Donor: [
    { id: "d-1", name: "Thomas Family" },
    { id: "d-2", name: "Johnson Family" },
  ],
  Fan: [
    { id: "f-1", name: "Sarah Johnson" },
    { id: "f-2", name: "Ava Johnson" },
  ],
};

// Starter message per category, editable in the Customize step.
export const DEFAULT_MESSAGE: Record<RecognitionCategory, string> = {
  Player: "Jordan never gave up. Played all 4 quarters with everything he had — real leader on the floor.",
  Coach: "Coach kept the bench fired up from tip-off to the final buzzer.",
  Parent: "Thank you for running the snack table and cheering the loudest all night!",
  Sponsor: "Thank you for supporting our student athletes this season.",
  Donor: "We appreciate your generous gift to the scoreboard fund.",
  Fan: "Shoutout for never missing a home game and leading every chant!",
};

export const MESSAGE_MAX = 300;
