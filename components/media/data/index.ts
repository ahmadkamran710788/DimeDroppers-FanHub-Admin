// SAMPLE DATA — there is no media endpoint yet. Mirrors the Figma design (4.1 Media);
// replace with an API call once the backend exposes a media list.

export type MediaType = "Photo" | "Video";

export interface MediaItem {
  id: string;
  name: string;
  // File extension shown under the name, e.g. "PNG".
  format: string;
  type: MediaType;
  preview: string;
  tags: string[];
  uploadedBy: string;
  // ISO timestamp.
  uploadedAt: string;
}

export const MEDIA_TYPE_COLOR: Record<MediaType, string> = {
  Photo: "bg-steel-blue",
  Video: "bg-[#9D62C1]",
};

// 18 rows, matching the design's sample list.
export const SAMPLE_MEDIA: MediaItem[] = Array.from({ length: 18 }, (_, i) => ({
  id: `sample-media-${i + 1}`,
  name: "tlam-logo.png",
  format: "PNG",
  type: "Photo",
  preview: "/images/media-sample.png",
  tags: ["tlam", "logo", "greyscale"],
  uploadedBy: "Michael Scott",
  uploadedAt: "2026-05-29T10:45:00",
}));
