export const GENDER_OPTIONS = [
  { label: "Boys", value: "Boys" },
  { label: "Girls", value: "Girls" },
  { label: "Other", value: "Other" },
];

export const SEASON_OPTIONS = [
  "Fall 23-24", "Fall 24-25", "Fall 25-26", "Fall 26-27",
  "Spring 23-24", "Spring 24-25", "Spring 25-26",
  "Winter 23-24", "Winter 24-25", "Winter 25-26",
].map((s) => ({ label: s, value: s }));

export const SPORTS_OPTIONS = [
  "Basketball", "Football", "Soccer", "Baseball",
  "Volleyball", "Track & Field", "Swimming", "Wrestling",
].map((s) => ({ label: s, value: s }));

export const LEVEL_OPTIONS = [
  { label: "9th Grade", value: "9th Grade" },
  { label: "JV", value: "JV" },
  { label: "Varsity", value: "Varsity" },
];

// Schedule page filter dropdowns.
export const SCHEDULE_VIEW_FILTERS = [
  { label: "Past", value: "past" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Home", value: "home" },
  { label: "Away", value: "away" },
];

export const SCHEDULE_SEASON_FILTERS = ["Fall", "Winter", "Spring", "Summer"].map((s) => ({ label: s, value: s }));

export const SCHEDULE_LEVEL_FILTERS = ["Freshman", "JV", "Varsity"].map((s) => ({ label: s, value: s }));

export const SCHEDULE_GENDER_FILTERS = GENDER_OPTIONS.filter((o) => o.value !== "Other");

export const SCHEDULE_VENUE_FILTERS = ["The Big House", "Lake Country Clubhouse"].map((s) => ({ label: s, value: s }));

export const SCHEDULE_DIVISION_FILTERS = ["17U Gold", "16U Gold"].map((s) => ({ label: s, value: s }));
