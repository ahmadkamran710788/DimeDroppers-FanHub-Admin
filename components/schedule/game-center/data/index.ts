// SAMPLE DATA — there is no game center endpoint yet. Mirrors the Subway "Highlights", "Recap"
// and "Shop" mockups; replace with the game's real result, recap, clips and shop items once the API exists.

export interface GameTeam {
  name: string;
  logo: string;
  score: number;
}

export interface Highlight {
  id: string;
  title: string;
  author: string;
  // Clip length in seconds.
  duration: number;
  thumbnail: string;
}

export interface TeamLeader {
  name: string;
  // Stat line, e.g. [{ value: 16, label: "PTS" }].
  stats: { value: number; label: string }[];
}

export interface GameRecap {
  headline: string;
  // ISO date.
  date: string;
  venue: string;
  photo: string;
  paragraphs: string[];
  leaders: { home: TeamLeader | null; away: TeamLeader | null };
}

export type ShopCategory = "Merch & Apparel" | "Player Cards" | "Highlights" | "Activity";

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  // Price in Dimes, the fan-hub points currency.
  dimes: number;
  image: string;
  trending: boolean;
  category: ShopCategory;
  apparelType: string;
  brand: string;
  color: string;
}

export interface GameCenter {
  sponsor: { name: string; presentedLogo: string };
  home: GameTeam;
  away: GameTeam;
  // e.g. "Final", "Q3 4:12".
  status: string;
  highlights: Highlight[];
  recap: GameRecap;
  shop: ShopProduct[];
}

export const SAMPLE_GAME: GameCenter = {
  sponsor: {
    name: "Subway",
    presentedLogo: "/images/highlights/sponsor-presented.png",
  },
  home: { name: "Twin Lakes Academy Middle", logo: "/images/highlights/team-home.png", score: 56 },
  away: { name: "Landmark", logo: "/images/highlights/team-away.png", score: 30 },
  status: "Final",
  highlights: [
    { id: "h-1", title: "2 point FG", author: "Michael Denvers", duration: 30, thumbnail: "/images/highlights/highlight-1.jpg" },
    { id: "h-2", title: "Slam dunk", author: "Jay Ryan", duration: 15, thumbnail: "/images/highlights/highlight-2.jpg" },
    { id: "h-3", title: "Fast Break", author: "Chris Miller", duration: 20, thumbnail: "/images/highlights/highlight-3.jpg" },
  ],
  recap: {
    headline: "Mount's Double-Double Powers Twin Lakes Past Landmark 56-30",
    date: "2026-09-22",
    venue: "Twin Lakes Academy (Home)",
    photo: "/images/highlights/recap-photo.jpg",
    paragraphs: [
      "Twin Lakes Academy Middle School dominated from the opening tip and never trailed, cruising to a 56-30 win over Landmark Middle School in Jacksonville.",
      "The home side seized control immediately, opening on an 11-2 burst as Jonathan Mount cleaned up on the glass and finished inside. Twin Lakes led 14-4 after the first quarter and steadily stretched the margin every period, taking a 28-15 edge into halftime before pushing further ahead in the third and fourth.",
      "Mount led all scorers with 16 points and 8 rebounds, adding four blocks that repeatedly stifled Landmark's interior looks.",
    ],
    leaders: {
      home: {
        name: "Jonathan Mount",
        stats: [
          { value: 16, label: "PTS" },
          { value: 8, label: "REB" },
          { value: 4, label: "BLK" },
        ],
      },
      away: null,
    },
  },
  shop: [
    {
      id: "p-1",
      name: "Official Hoodie",
      price: 49.99,
      dimes: 8000,
      image: "/images/shop/official-hoodie.jpg",
      trending: true,
      category: "Merch & Apparel",
      apparelType: "Hoodie",
      brand: "Twin Lakes Academy",
      color: "Black",
    },
    {
      id: "p-2",
      name: "Official Jersey",
      price: 49.99,
      dimes: 8000,
      image: "/images/shop/official-jersey.jpg",
      trending: true,
      category: "Merch & Apparel",
      apparelType: "T-Shirt",
      brand: "Twin Lakes Academy",
      color: "Black",
    },
    {
      id: "p-3",
      name: "Mom Jersey",
      price: 49.99,
      dimes: 8000,
      image: "/images/shop/mom-jersey.jpg",
      trending: false,
      category: "Merch & Apparel",
      apparelType: "T-Shirt",
      brand: "Twin Lakes Academy",
      color: "Black",
    },
    {
      id: "p-4",
      name: "Player Jersey",
      price: 49.99,
      dimes: 8000,
      image: "/images/shop/player-jersey.jpg",
      trending: false,
      category: "Merch & Apparel",
      apparelType: "T-Shirt",
      brand: "Twin Lakes Academy",
      color: "Black",
    },
  ],
};
