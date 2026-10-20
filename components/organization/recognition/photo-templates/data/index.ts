// SAMPLE DATA — there is no photo booth templates endpoint yet. Mirrors the "Fan Photo Booth"
// mockup; replace with the templates catalogue (and purchase state) once the API exists.

export type TemplateCategory = "Game Action" | "Championship" | "Arcade";

export interface PhotoTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  image: string;
  purchased: boolean;
  price: number;
}

export const TEMPLATE_CATEGORIES: readonly TemplateCategory[] = ["Game Action", "Championship", "Arcade"];

export const TEMPLATES_SPONSOR = { name: "Firehouse Subs", logo: "/images/collectibles/sponsor-firehouse.png" };

const IMG = (n: string) => `/images/fan-wall/templates/${n}.jpg`;

export const SAMPLE_PHOTO_TEMPLATES: PhotoTemplate[] = [
  { id: "t-1", name: "Championship", category: "Game Action", image: IMG("fast-break"), purchased: true, price: 4.99 },
  { id: "t-2", name: "Clutch Shot", category: "Game Action", image: IMG("defensive-block"), purchased: true, price: 4.99 },
  { id: "t-3", name: "Crowd Hype", category: "Game Action", image: IMG("arcade"), purchased: false, price: 4.99 },
  { id: "t-4", name: "Slam Dunk", category: "Game Action", image: IMG("slam-dunk"), purchased: false, price: 4.99 },
  { id: "t-5", name: "Title Run", category: "Championship", image: IMG("fast-break"), purchased: false, price: 6.99 },
  { id: "t-6", name: "Banner Night", category: "Championship", image: IMG("slam-dunk"), purchased: true, price: 6.99 },
  { id: "t-7", name: "Neon Arcade", category: "Arcade", image: IMG("arcade"), purchased: false, price: 3.99 },
  { id: "t-8", name: "Block Party", category: "Arcade", image: IMG("defensive-block"), purchased: false, price: 3.99 },
];
