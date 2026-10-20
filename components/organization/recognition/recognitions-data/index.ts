// SAMPLE DATA — there is no recognitions endpoint yet. Mirrors the Recognition & Fan Wall
// mockup (recognitions table + live preview); replace with API data once the backend exists.

export type RecognitionCategory = "Player" | "Parent" | "Coach" | "Sponsor" | "Donor" | "Fan";
export type RecognitionStatus = "Published" | "Draft";
export type RecognitionTemplate =
  | "Hustle"
  | "Teamwork"
  | "Game Changer"
  | "Fan Favorite"
  | "Player of the Game"
  | "Rising Star"
  | "Leadership"
  | "Motivator"
  | "Super Fan"
  | "Partner Spotlight"
  | "Fan Love"
  | "Thank You"
  | "Appreciation"
  | "Fan Shoutout";

export interface Recognition {
  id: string;
  category: RecognitionCategory;
  recipient: string;
  // Jersey number for players and parents' players.
  number?: number;
  template: RecognitionTemplate;
  // Matchup or a non-game event like "Season 2026".
  event: string;
  opponent?: { name: string; logo: string };
  status: RecognitionStatus;
  postedBy: string;
  postedByRole: string;
  // ISO date-time.
  date: string;
  message: string;
}

// Our school's crest on the preview card.
export const HOME_TEAM = { name: "TLAM", logo: "/images/fan-wall/tlam.png" };
export const MUSTANGS = { name: "Mandarin Mustangs", logo: "/images/fan-wall/mandarin-mustangs.png" };

export const SAMPLE_RECOGNITIONS: Recognition[] = [
  {
    id: "rec-1",
    category: "Player",
    recipient: "Jordan Smith",
    number: 12,
    template: "Hustle",
    event: "TLAM vs Mandarin Mustangs",
    opponent: MUSTANGS,
    status: "Published",
    postedBy: "Coach Mike",
    postedByRole: "Head Coach",
    date: "2026-06-30T22:00:00",
    message: "Jordan never gave up. Played all 4 quarters with everything he had — real leader on the floor.",
  },
  {
    id: "rec-2",
    category: "Parent",
    recipient: "Marcus Lee",
    number: 23,
    template: "Teamwork",
    event: "TLAM vs Mandarin Mustangs",
    opponent: MUSTANGS,
    status: "Published",
    postedBy: "Maya R.",
    postedByRole: "Team Parent",
    date: "2026-06-30T22:00:00",
    message: "Thank you for running the snack table and cheering the loudest all night!",
  },
  {
    id: "rec-3",
    category: "Coach",
    recipient: "Caleb Wright",
    number: 8,
    template: "Fan Love",
    event: "TLAM vs Mandarin Mustangs",
    opponent: MUSTANGS,
    status: "Published",
    postedBy: "Coach Rivera",
    postedByRole: "Assistant Coach",
    date: "2026-06-30T22:00:00",
    message: "Fans loved the energy Coach Wright brought to the bench tonight.",
  },
  {
    id: "rec-4",
    category: "Sponsor",
    recipient: "Dime Athletics",
    template: "Thank You",
    event: "TLAM vs Mandarin Mustangs",
    opponent: MUSTANGS,
    status: "Published",
    postedBy: "Admin",
    postedByRole: "Organization Admin",
    date: "2026-06-28T19:00:00",
    message: "Thank you Dime Athletics for supporting our student athletes this season.",
  },
  {
    id: "rec-5",
    category: "Donor",
    recipient: "Thomas Family",
    template: "Appreciation",
    event: "Season 2026",
    status: "Draft",
    postedBy: "Admin",
    postedByRole: "Organization Admin",
    date: "2026-06-27T14:30:00",
    message: "We appreciate the Thomas Family's generous donation to the new scoreboard fund.",
  },
  {
    id: "rec-6",
    category: "Fan",
    recipient: "Sarah Johnson",
    template: "Fan Shoutout",
    event: "TLAM vs Mandarin Mustangs",
    opponent: MUSTANGS,
    status: "Published",
    postedBy: "Admin",
    postedByRole: "Organization Admin",
    date: "2026-06-25T21:00:00",
    message: "Shoutout to Sarah for never missing a home game and leading every chant!",
  },
];
