import { LEVEL_OPTIONS } from "@/utils/constants/schedule";

// Teams can be middle-school grades too, so extend the schedule levels.
export const TEAM_LEVEL_OPTIONS = [
  { label: "6th Grade", value: "6th Grade" },
  { label: "7th Grade", value: "7th Grade" },
  { label: "8th Grade", value: "8th Grade" },
  { label: "Middle School", value: "Middle School" },
  ...LEVEL_OPTIONS,
];

// The genders the teams API takes.
export const TEAM_GENDER_OPTIONS = [
  { label: "Boys", value: "Boys" },
  { label: "Girls", value: "Girls" },
  { label: "Coed", value: "Coed" },
];

// A level / gender saved outside the lists above still shows as an option.
export const withCurrent = (options: { label: string; value: string }[], current?: string | null) =>
  current && !options.some((o) => o.value === current) ? [{ label: current, value: current }, ...options] : options;
