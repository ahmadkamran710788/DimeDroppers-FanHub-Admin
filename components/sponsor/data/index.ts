import { toOptions } from "@/utils/helper";
import type { LogoVariant, VariantSpec } from "@/utils/types/sponsor-brand-assets";
import type { LogoRules, SponsorBrandProfile, SponsorSignupOptions } from "@/utils/types/sponsor-profile";

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

// "Other" in the category list (sign-up and profile): it opens a box where the sponsor adds categories of their
// own, which are sent as their text.
export const OTHER_CATEGORY = "__other__";
export const CUSTOM_CATEGORY_MAX = 60;
// The most categories a sponsor can have: the API refuses a sixth ("Choose up to 5 categories"), and its options
// don't send the limit.
export const CATEGORY_MAX = 5;

type CategoryOption = SponsorSignupOptions["categories"][number];

// A picked category's label: a code's from the list, a typed one as it is.
export const categoryLabel = (category: string, options: CategoryOption[]) =>
  options.find((c) => c.code === category)?.label ?? category;

// The categories with a typed one added: as the listed code when it names one, and not twice (any case).
export function withTypedCategory(categories: string[], typed: string, options: CategoryOption[]) {
  const text = typed.trim();
  if (!text) return categories;
  const wanted = text.toLowerCase();
  const category = options.find((c) => c.label.toLowerCase() === wanted)?.code ?? text;
  return categories.some((c) => c.toLowerCase() === category.toLowerCase()) ? categories : [...categories, category];
}

// The sponsor's saved categories; an older profile without `categories` has only its one `category`.
export const savedCategories = (brand: SponsorBrandProfile | null): string[] =>
  brand?.categories?.length ? brand.categories : brand?.category ? [brand.category] : [];

// The same categories, in any order.
export const sameCategories = (a: string[], b: string[]) => a.length === b.length && a.every((c) => b.includes(c));

// The categories in a multipart sign-up or profile save: the list as JSON text (commas inside a name would split
// plain text), and the first one as `category`, which the API ignores when `categories` is sent.
export function appendCategories(form: FormData, categories: string[]) {
  form.append("categories", JSON.stringify(categories));
  if (categories[0]) form.append("category", categories[0]);
}

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
    const size = await imageSize(file);
    if (!size) return "Logo must be an SVG or PNG image";
    if (size.width < rules.minWidth || size.height < rules.minHeight) {
      return `Logo must be at least ${rules.minWidth}×${rules.minHeight} px`;
    }
  }
  return null;
}

// A PNG or JPG's size in pixels; null when the browser can't read it as an image.
async function imageSize(file: File): Promise<{ width: number; height: number } | null> {
  const image = await createImageBitmap(file).catch(() => null);
  if (!image) return null;
  const size = { width: image.width, height: image.height };
  image.close();
  return size;
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/svg+xml": ".svg",
  "image/png": ".png",
  "image/jpeg": ".jpg,.jpeg",
};

// The square kinds: the icon and the circular logo (shown in a circle). A first letter stands in for them, and
// they're fitted in a square frame with a safe zone.
export const isSquareLogo = (variant: LogoVariant) => variant === "ICON" || variant === "CIRCULAR";

// The file picker filter for one logo kind (".svg,.png,.jpg,.jpeg").
export const logoAccept = (spec: VariantSpec) =>
  spec.mimeTypes.map((type) => MIME_EXTENSIONS[type] ?? type).join(",");

// "SVG, PNG or JPG".
const joinOr = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}` : (items[0] ?? "");

// Whether a picked file is a format its kind takes: the problem to show, or null. Checked before the fit editor
// opens; the fitted file it saves goes through checkBrandLogo.
export function checkLogoFormat(file: File, spec: VariantSpec): string | null {
  // Some systems give no type; the backend reads the file itself.
  if (file.type && !spec.mimeTypes.includes(file.type)) return `${spec.label} must be ${joinOr(spec.formats)}`;
  return null;
}

// A Brand Assets logo against its kind's rules from GET /brand-assets/options: the problem to show, or null when
// it's fine. Size and shape are checked for a PNG or JPG; an SVG's, and a white PNG's transparency, are left
// to the backend, which checks everything again.
export async function checkBrandLogo(file: File, spec: VariantSpec, maxBytes: number): Promise<string | null> {
  const format = checkLogoFormat(file, spec);
  if (format) return format;
  if (file.size > maxBytes) return `Logo must be ${Number((maxBytes / (1024 * 1024)).toFixed(1))} MB or smaller`;
  if (file.type !== "image/png" && file.type !== "image/jpeg") return null;

  const size = await imageSize(file);
  if (!size) return "The file could not be read as an image";
  const recommended = `${spec.recommended.width}×${spec.recommended.height} px`;
  if (size.width < spec.minWidth || size.height < spec.minHeight) {
    return `${spec.label} must be at least ${spec.minWidth}×${spec.minHeight} px (recommended ${recommended})`;
  }
  const ratio = size.width / size.height;
  if (ratio < spec.minRatio || ratio > spec.maxRatio) {
    return spec.maxRatio < 1.5
      ? `${spec.label} must be square (recommended ${recommended})`
      : `${spec.label} is too tall or too wide. Use a wide wordmark (recommended ${recommended})`;
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
