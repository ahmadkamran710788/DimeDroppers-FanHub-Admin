// SAMPLE DATA — there is no team shop endpoint yet. Products an admin sells per team
// (merch, highlight videos, digital collectibles); replace with API data once it exists.

export type ProductType = "Merch" | "Video" | "Collectible";
export type ProductStatus = "Active" | "Draft";
export type CollectibleRarity = "Legendary" | "Epic" | "Rare";

export interface TeamShopProduct {
  id: string;
  teamId: string;
  type: ProductType;
  name: string;
  image: string;
  price: number;
  // Price in Dimes, the fan-hub points currency.
  dimes: number;
  status: ProductStatus;
  // Merch only.
  stock?: number;
  sizes?: string[];
  // Video only, in seconds.
  duration?: number;
  // Collectible only.
  rarity?: CollectibleRarity;
  // Game the video or collectible is from.
  game?: string;
}

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  Merch: "Merch & Apparel",
  Video: "Video",
  Collectible: "Digital Collectible",
};

export const MERCH_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const RARITIES: CollectibleRarity[] = ["Legendary", "Epic", "Rare"];
export const SAMPLE_GAMES = ["TLAM vs Landmark · Sep 3", "TLAM vs Riverside · Sep 5", "TLAM vs Mandarin Mustangs · Jun 30"];

const merch = (teamId: string): TeamShopProduct[] => [
  { id: `${teamId}-m1`, teamId, type: "Merch", name: "Official Hoodie", image: "/images/shop/official-hoodie.jpg", price: 49.99, dimes: 8000, status: "Active", stock: 42, sizes: ["S", "M", "L", "XL"] },
  { id: `${teamId}-m2`, teamId, type: "Merch", name: "Official Jersey", image: "/images/shop/official-jersey.jpg", price: 49.99, dimes: 8000, status: "Active", stock: 18, sizes: ["S", "M", "L"] },
  { id: `${teamId}-m3`, teamId, type: "Merch", name: "Mom Jersey", image: "/images/shop/mom-jersey.jpg", price: 39.99, dimes: 6500, status: "Draft", stock: 0, sizes: ["S", "M", "L", "XL"] },
  { id: `${teamId}-m4`, teamId, type: "Merch", name: "Player Jersey", image: "/images/shop/player-jersey.jpg", price: 59.99, dimes: 9500, status: "Active", stock: 7, sizes: ["M", "L", "XL"] },
];

const videos = (teamId: string): TeamShopProduct[] => [
  { id: `${teamId}-v1`, teamId, type: "Video", name: "2 point FG", image: "/images/highlights/highlight-1.jpg", price: 1.99, dimes: 300, status: "Active", duration: 30, game: SAMPLE_GAMES[0] },
  { id: `${teamId}-v2`, teamId, type: "Video", name: "Slam dunk", image: "/images/highlights/highlight-2.jpg", price: 1.99, dimes: 300, status: "Active", duration: 15, game: SAMPLE_GAMES[0] },
  { id: `${teamId}-v3`, teamId, type: "Video", name: "Fast Break", image: "/images/highlights/highlight-3.jpg", price: 2.49, dimes: 400, status: "Draft", duration: 20, game: SAMPLE_GAMES[1] },
];

const collectibles = (teamId: string): TeamShopProduct[] =>
  [1, 2, 3, 4].map((n) => ({
    id: `${teamId}-c${n}`,
    teamId,
    type: "Collectible" as const,
    name: "Gold Standard",
    image: `/images/collectibles/card-${n}.jpg`,
    price: 5.99,
    dimes: 900,
    status: "Active" as const,
    rarity: "Legendary" as const,
    game: SAMPLE_GAMES[0],
  }));

// Products per team id (teams from the Teams sample list).
export const sampleProducts = (teamId: string): TeamShopProduct[] => [...merch(teamId), ...videos(teamId), ...collectibles(teamId)];
