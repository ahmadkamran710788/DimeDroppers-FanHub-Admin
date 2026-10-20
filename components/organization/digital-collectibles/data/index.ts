// SAMPLE DATA — there is no collectibles endpoint yet. Mirrors the "Choose Card Template"
// mockup; replace with each game's collectible cards once the backend exposes them.

export type CollectibleRarity = "Legendary" | "Epic" | "Rare";

export interface Collectible {
  id: string;
  name: string;
  image: string;
  rarity: CollectibleRarity;
  price: number;
  // Price in Dimes, the fan-hub points currency.
  dimes: number;
}

export const COLLECTIBLES_SPONSOR = { name: "Firehouse Subs", logo: "/images/collectibles/sponsor-firehouse.png" };

const CARDS: Collectible[] = [1, 2, 3, 4].map((n) => ({
  id: `card-${n}`,
  name: "Gold Standard",
  image: `/images/collectibles/card-${n}.jpg`,
  rarity: "Legendary",
  price: 5.99,
  dimes: 900,
}));

// Collectible cards per game id (games from the Media sample list). Upcoming games have none yet.
export const SAMPLE_COLLECTIBLES: Record<string, Collectible[]> = {
  "game-1": CARDS,
  "game-2": CARDS,
};
