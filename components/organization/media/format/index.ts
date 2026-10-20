// Date/time labels for the Media games list and hero, from an ISO date-time.

const date = (iso: string) => new Date(iso);

export const monthShort = (iso: string) => date(iso).toLocaleDateString("en-US", { month: "short" }).toUpperCase();
export const dayOfMonth = (iso: string) => date(iso).getDate();
export const weekdayShort = (iso: string) => date(iso).toLocaleDateString("en-US", { weekday: "short" });
export const timeOfDay = (iso: string) =>
  date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fullDate = (iso: string) =>
  date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
