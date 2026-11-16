import { toOptions } from "@/utils/helper";
import type { LogoRules } from "@/utils/types/sponsor-profile";

// The signed-in sponsor, shown in the sponsor header and sidebar. Mock data until sponsor
// auth is integrated.
export const SPONSOR_PROFILE = {
  name: "Northpeak Energy",
  email: "partners@northpeak.co",
  initials: "NP",
};

// A sponsor's category, picked at sign-up and changed on Sponsor Profile and Brand Assets. A-Z.
export const SPONSOR_CATEGORY_OPTIONS = toOptions([
  "Automotive & Transportation",
  "Banking, Finance & Payments",
  "Community Development & Nonprofits",
  "Education & Career Development",
  "Entertainment & Media",
  "Fashion & Lifestyle",
  "Fitness, Health & Recovery",
  "Food, Beverage & Nutrition",
  "Gaming & Esports",
  "Government & Public Initiatives",
  "Home, Retail & Consumer Goods",
  "Insurance & Professional Services",
  "Local Businesses & Community Partners",
  "Sports & Athletic Apparel",
  "Sports Collectibles & Merchandise",
  "Sports Technology & Analytics",
  "Technology & Consumer Electronics",
  "Telecommunications & Internet",
  "Travel, Hotels & Hospitality",
  "Youth Sports & Family Brands",
]);

// The API's sponsor categories (sign-up and profile) as dropdown options, A-Z by label.
export const categoryOptionsAZ = (categories: { code: string; label: string }[]) =>
  categories
    .map((c) => ({ label: c.label, value: c.code }))
    .sort((a, b) => a.label.localeCompare(b.label));

// "Other" in the category list (sign-up and profile): the sponsor types their own category, which is sent as
// the category's text.
export const OTHER_CATEGORY = "__other__";
export const CUSTOM_CATEGORY_MAX = 60;

// The category to send: the typed one for Other, else the picked option (a code, or Google's business type).
export const categoryText = (category: string, other: string) =>
  category === OTHER_CATEGORY ? other.trim() : category;

// The sponsor's logo: SVG or PNG only (file picker filter, and the check for dropped files).
export const LOGO_ACCEPT = ".svg,.png";
export const isLogoFile = (file: File) => /\.(svg|png)$/i.test(file.name);

// The sign-up and profile logo, against the rules from the sponsor options (the backend checks the same):
// the problem to show under the logo, or null when it's fine. Only a PNG's size in pixels is checked.
export async function checkLogo(file: File, rules: LogoRules): Promise<string | null> {
  if (!rules.types.includes(file.type)) return "Logo must be an SVG or PNG image";
  if (file.size > rules.maxBytes) {
    return `Logo must be ${Number((rules.maxBytes / (1024 * 1024)).toFixed(1))} MB or smaller`;
  }
  if (file.type === "image/png") {
    const image = await createImageBitmap(file).catch(() => null);
    if (!image) return "Logo must be an SVG or PNG image";
    const tooSmall = image.width < rules.minWidth || image.height < rules.minHeight;
    image.close();
    if (tooSmall) return `Logo must be at least ${rules.minWidth}×${rules.minHeight} px`;
  }
  return null;
}

// "Downtown Austin store, Round Rock store +1 more": the stores an activation or cart item is for, by name
// (else city), the first `max` of them.
export const storeNames = (stores: { name: string | null; city: string | null }[], max = 3) => {
  const names = stores.map((s) => s.name || s.city || "Unnamed store");
  const more = names.length - max;
  return more > 0 ? `${names.slice(0, max).join(", ")} +${more} more` : names.join(", ");
};
