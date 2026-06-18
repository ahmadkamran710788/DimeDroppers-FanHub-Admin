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
