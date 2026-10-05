// SAMPLE DATA — there is no fan wall endpoint yet. Mirrors the Recognition & Fan Wall mockup;
// replace with uploaded fan photos and the saved wall layout once the API exists.

export interface FanPhoto {
  id: string;
  src: string;
  event: string;
  team: string;
  uploader: string;
  // ISO date.
  uploadedAt: string;
}

const EVENTS = ["Homecoming Game", "Senior Night", "Rivalry Week"];
const TEAMS = ["Boys Basketball", "Girls Basketball"];
const UPLOADERS = ["Ava Johnson", "King Williams", "Sofia Martinez", "Cayden Richardson"];

export const SAMPLE_PHOTOS: FanPhoto[] = Array.from({ length: 12 }, (_, i) => ({
  id: `photo-${i + 1}`,
  src: `/images/fan-wall/photo-${i + 1}.jpg`,
  event: EVENTS[i % EVENTS.length],
  team: TEAMS[i % TEAMS.length],
  uploader: UPLOADERS[i % UPLOADERS.length],
  uploadedAt: `2026-09-${String(3 + (i % 4) * 5).padStart(2, "0")}`,
}));

// Total photos fans have uploaded (the grid shows the most recent page).
export const SAMPLE_PHOTO_TOTAL = 56;

// Photos already placed on the fan wall, in display order.
export const SAMPLE_LAYOUT = ["photo-1", "photo-2", "photo-3", "photo-4", "photo-9", "photo-11", "photo-12"];
