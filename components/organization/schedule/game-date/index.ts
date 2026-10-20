// Date parts for a game's date column, e.g. { day: 3, month: "SEP", weekday: "THU" }.
export function parseGameDate(iso: string): { day: number; month: string; weekday: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { day: 0, month: "---", weekday: "---" };
  return {
    day: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
  };
}

// Kick-off time plus the viewer's time zone city, e.g. { time: "10:00 PM", tz: "Karachi" }.
export function formatTime(iso: string, isAllDay: boolean): { time: string; tz: string } {
  if (isAllDay) return { time: "All Day", tz: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { time: "---", tz: "" };
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop() ?? "";
  return { time, tz };
}
