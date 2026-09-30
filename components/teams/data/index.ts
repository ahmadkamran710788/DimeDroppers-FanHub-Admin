// Static demo data for the Teams list (design 3.1). There is no teams list endpoint
// yet — replace TEAMS / TEAM_STATS with an API call once the backend exposes one.

export type TeamStatus = "Active" | "Inactive";
export type Sport = "Basketball" | "Football" | "Soccer";

export interface Team {
  id: string;
  name: string;
  schoolName: string;
  sport: Sport;
  level: string;
  headCoach: string;
  athletes: number;
  status: TeamStatus;
  // Ring colour around the team crest.
  ring: string;
}

export const SPORT_ICON: Record<Sport, string> = {
  Basketball: "/icons/icon-dribbble.svg",
  Football: "/icons/icon-football.svg",
  Soccer: "/icons/icon-dribbble.svg",
};

const RING = { gray: "#9CA3AF", blue: "#3B84C9", red: "#C0392B" };

const BASE: Omit<Team, "id">[] = [
  { name: "Varsity Boys Basketball", schoolName: "Twin Lakes Tigers", sport: "Basketball", level: "Varsity", headCoach: "Lincoln Korsgaard", athletes: 18, status: "Active", ring: RING.gray },
  { name: "Varsity Boys Basketball", schoolName: "Twin Lakes Tigers", sport: "Basketball", level: "Varsity", headCoach: "James Workman", athletes: 18, status: "Active", ring: RING.gray },
  { name: "Varsity Football", schoolName: "Twin Lakes Tigers", sport: "Football", level: "Junior Varsity", headCoach: "Alfredo Bator", athletes: 18, status: "Active", ring: RING.blue },
  { name: "Varsity Football", schoolName: "Twin Lakes Tigers", sport: "Football", level: "Junior Varsity", headCoach: "Cristofer Lubin", athletes: 18, status: "Active", ring: RING.blue },
  { name: "Varsity Soccer (Boys)", schoolName: "Twin Lakes Tigers", sport: "Soccer", level: "Junior Varsity", headCoach: "James Culhane", athletes: 18, status: "Active", ring: RING.red },
  { name: "Varsity Soccer (Girls)", schoolName: "Twin Lakes Tigers", sport: "Soccer", level: "Junior Varsity", headCoach: "Zain Culhane", athletes: 18, status: "Active", ring: RING.red },
];

// 18 rows (the design's "Teams (18)"), cycling the base set.
export const TEAMS: Team[] = Array.from({ length: 18 }, (_, i) => ({
  id: `team-${i + 1}`,
  ...BASE[i % BASE.length],
  status: i === 16 || i === 17 ? "Inactive" : "Active",
}));

export interface Athlete {
  id: string;
  name: string;
  email: string;
  avatar: string;
  jersey: number;
  position: string;
  graduated: number;
  status: TeamStatus;
}

// Demo roster for the Add Team → Athletes tab (design 3.2), until a roster endpoint exists.
export const ATHLETES: Athlete[] = Array.from({ length: 18 }, (_, i) => ({
  id: `athlete-${i + 1}`,
  name: "Jay Ryan",
  email: "jayryan@gmail.com",
  avatar: "/images/avatar-photo.png",
  jersey: 23,
  position: "Point Guard",
  graduated: 2019,
  status: "Active",
}));

export const TEAM_STATS = {
  coachesAndStaff: 47,
  coachesAndStaffPct: "7% of total",
  athletesPct: "47% of total",
};
