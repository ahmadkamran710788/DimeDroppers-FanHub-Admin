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

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: TeamStatus;
}

// Demo staff for the team details → Staff tab, until a team staff endpoint exists.
export const STAFF: StaffMember[] = [
  { id: "staff-1", name: "Lincoln Korsgaard", role: "Head Coach", email: "lincoln@twinlakes.edu", phone: "(555) 201-4410", status: "Active" },
  { id: "staff-2", name: "Maria Lopez", role: "Assistant Coach", email: "maria@twinlakes.edu", phone: "(555) 201-4421", status: "Active" },
  { id: "staff-3", name: "Derek Hale", role: "Assistant Coach", email: "derek@twinlakes.edu", phone: "(555) 201-4432", status: "Active" },
  { id: "staff-4", name: "Priya Nair", role: "Team Manager", email: "priya@twinlakes.edu", phone: "(555) 201-4443", status: "Active" },
  { id: "staff-5", name: "Sam Ortega", role: "Athletic Trainer", email: "sam@twinlakes.edu", phone: "(555) 201-4454", status: "Inactive" },
];

export type ParentRelationship = "Mother" | "Father" | "Guardian";

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: ParentRelationship;
  // Athlete on the roster this parent is linked to.
  athlete: string;
  jersey: number;
}

const PARENT_NAMES: [string, ParentRelationship][] = [
  ["Maria Ryan", "Mother"],
  ["David Ryan", "Father"],
  ["Angela Smith", "Mother"],
  ["Robert Lee", "Father"],
  ["Linda Carter", "Guardian"],
  ["James Williams", "Father"],
];
const PARENT_ATHLETES: [string, number][] = [
  ["Jay Ryan", 23],
  ["Jay Ryan", 23],
  ["Jordan Smith", 12],
  ["Marcus Lee", 5],
  ["Lily Carter", 3],
  ["King Williams", 10],
];

// Demo parents for the Team Details → Parents tab, until a parents endpoint exists.
export const PARENTS: Parent[] = Array.from({ length: 14 }, (_, i) => {
  const [name, relationship] = PARENT_NAMES[i % PARENT_NAMES.length];
  const [athlete, jersey] = PARENT_ATHLETES[i % PARENT_ATHLETES.length];
  return {
    id: `parent-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@gmail.com`,
    phone: `(555) ${300 + i}-${4110 + i}`,
    relationship,
    athlete,
    jersey,
  };
});

export type FollowerType = "Parent" | "Fan" | "Alumni";

export interface Follower {
  id: string;
  name: string;
  email: string;
  type: FollowerType;
  // ISO date the follow started.
  followingSince: string;
}

const FOLLOWER_NAMES = ["Ava Johnson", "Sarah Johnson", "Marcus Lee", "Thomas Family", "Maya R.", "Chris Miller", "Jay Ryan", "Sofia Martinez"];
const FOLLOWER_TYPES: FollowerType[] = ["Parent", "Fan", "Alumni"];

// Demo followers for the team details → Followers tab, until a followers endpoint exists.
export const FOLLOWERS: Follower[] = Array.from({ length: 24 }, (_, i) => {
  const name = FOLLOWER_NAMES[i % FOLLOWER_NAMES.length];
  return {
    id: `follower-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/.$/, "")}@gmail.com`,
    type: FOLLOWER_TYPES[i % FOLLOWER_TYPES.length],
    followingSince: `2026-0${1 + (i % 9)}-${String(5 + (i % 20)).padStart(2, "0")}`,
  };
});

export const TEAM_STATS = {
  coachesAndStaff: 47,
  coachesAndStaffPct: "7% of total",
  athletesPct: "47% of total",
};
