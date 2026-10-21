import * as yup from "yup";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
// A bare domain, optionally with http(s):// and a path (northpeak.co, https://www.northpeak.co/brand).
const WEBSITE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

// The Brand profile card.
export const brandProfileSchema = yup.object({
  name: yup.string().trim().required("Brand name is required").max(80, "Keep the brand name under 80 characters"),
  tagline: yup.string().trim().max(120, "Keep the tagline under 120 characters"),
  website: yup.string().trim().required("Website is required").matches(WEBSITE, "Enter a website like northpeak.co"),
  category: yup.string().required("Pick a category"),
  notes: yup.string().trim().max(500, "Keep the usage notes under 500 characters"),
});

// A color added to the brand palette; `existing` holds the colors already in it.
export const brandColorSchema = (existing: string[]) =>
  yup.object({
    color: yup
      .string()
      .required("Pick a color")
      .matches(HEX_COLOR, "Enter a hex color like #F26B1D")
      .test("is-new", "That color is already in your palette", (color) =>
        !existing.some((c) => c.toLowerCase() === color?.toLowerCase())
      ),
  });
