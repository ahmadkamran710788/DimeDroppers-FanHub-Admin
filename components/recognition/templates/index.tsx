import type { ReactNode } from "react";
import {
  BadgeCheck,
  Flame,
  GraduationCap,
  Handshake,
  Heart,
  HeartHandshake,
  Megaphone,
  PartyPopper,
  Rocket,
  Sparkles,
  Star,
  Trophy,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import type { RecognitionCategory, RecognitionTemplate } from "@/components/recognition/recognitions-data";

const ICON = "size-4 shrink-0";

export interface CategoryInfo {
  icon: (cls?: string) => ReactNode;
  // Pill fill in the recognitions table.
  pill: string;
  // Icon colour on the category picker cards.
  tint: string;
  description: string;
  templates: RecognitionTemplate[];
}

export const CATEGORIES: Record<RecognitionCategory, CategoryInfo> = {
  Player: {
    icon: (c = ICON) => <User className={c} strokeWidth={2} />,
    pill: "bg-[#2F5BD3]",
    tint: "text-[#60A5FA]",
    description: "Recognize players for their performance, effort and more.",
    templates: ["Hustle", "Teamwork", "Game Changer", "Fan Favorite", "Player of the Game", "Rising Star"],
  },
  Coach: {
    icon: (c = ICON) => <GraduationCap className={c} strokeWidth={2} />,
    pill: "bg-[#5B3AA8]",
    tint: "text-[#C084FC]",
    description: "Recognize coaches for leadership and contribution.",
    templates: ["Leadership", "Motivator", "Fan Love", "Thank You"],
  },
  Parent: {
    icon: (c = ICON) => <Users className={c} strokeWidth={2} />,
    pill: "bg-[#1E7A4C]",
    tint: "text-[#4ADE80]",
    description: "Recognize parents and family members for their support.",
    templates: ["Teamwork", "Appreciation", "Super Fan", "Thank You"],
  },
  Sponsor: {
    icon: (c = ICON) => <BadgeCheck className={c} strokeWidth={2} />,
    pill: "bg-[#8A5A12]",
    tint: "text-[#FACC15]",
    description: "Recognize sponsors and their contribution to the team.",
    templates: ["Thank You", "Partner Spotlight", "Appreciation"],
  },
  Donor: {
    icon: (c = ICON) => <Heart className={`${c} fill-current`} strokeWidth={2} />,
    pill: "bg-[#8E2747]",
    tint: "text-[#F43F5E]",
    description: "Recognize donors and supporters.",
    templates: ["Appreciation", "Thank You"],
  },
  Fan: {
    icon: (c = ICON) => <UsersRound className={c} strokeWidth={2} />,
    pill: "bg-[#1F5F99]",
    tint: "text-[#60A5FA]",
    description: "Recognize exceptional fan support.",
    templates: ["Fan Shoutout", "Fan Love", "Super Fan"],
  },
};

export interface TemplateInfo {
  icon: (cls?: string) => ReactNode;
  // Pill fill in the recognitions table.
  pill: string;
  // Card / preview background.
  gradient: string;
  description: string;
}

export const TEMPLATES: Record<RecognitionTemplate, TemplateInfo> = {
  Hustle: {
    icon: (c = ICON) => <Flame className={`${c} text-orange-400 fill-orange-400`} strokeWidth={1.5} />,
    pill: "bg-[#2B3A67]",
    gradient: "linear-gradient(160deg,#2563EB,#1D4ED8 55%,#1E3A8A)",
    description: "Recognize a player for effort, energy and never giving up.",
  },
  Teamwork: {
    icon: (c = ICON) => <Handshake className={`${c} text-amber-300`} strokeWidth={2} />,
    pill: "bg-[#155E63]",
    gradient: "linear-gradient(160deg,#0F766E,#115E59 60%,#134E4A)",
    description: "Recognize passing, assists and putting the team first.",
  },
  "Game Changer": {
    icon: (c = ICON) => <Trophy className={`${c} text-amber-400`} strokeWidth={2} />,
    pill: "bg-[#4C1D95]",
    gradient: "linear-gradient(160deg,#7C3AED,#6D28D9 55%,#4C1D95)",
    description: "Recognize an outstanding performance or game-changing moment.",
  },
  "Fan Favorite": {
    icon: (c = ICON) => <Heart className={`${c} text-rose-400 fill-rose-400`} strokeWidth={2} />,
    pill: "bg-[#881337]",
    gradient: "linear-gradient(160deg,#BE123C,#9F1239 55%,#881337)",
    description: "Highlight a player who connected with the fans.",
  },
  "Player of the Game": {
    icon: (c = ICON) => <Star className={`${c} text-yellow-300 fill-yellow-300`} strokeWidth={2} />,
    pill: "bg-[#713F12]",
    gradient: "linear-gradient(160deg,#B45309,#A16207 55%,#713F12)",
    description: "Celebrate an exceptional overall performance.",
  },
  "Rising Star": {
    icon: (c = ICON) => <Rocket className={`${c} text-slate-200`} strokeWidth={2} />,
    pill: "bg-[#334155]",
    gradient: "linear-gradient(160deg,#64748B,#475569 55%,#334155)",
    description: "Recognize a player showing great potential and growth.",
  },
  Leadership: {
    icon: (c = ICON) => <Megaphone className={`${c} text-sky-300`} strokeWidth={2} />,
    pill: "bg-[#1E3A75]",
    gradient: "linear-gradient(160deg,#1D4ED8,#1E40AF 55%,#1E3A8A)",
    description: "Recognize a coach who leads by example.",
  },
  Motivator: {
    icon: (c = ICON) => <Sparkles className={`${c} text-fuchsia-300`} strokeWidth={2} />,
    pill: "bg-[#5B21B6]",
    gradient: "linear-gradient(160deg,#9333EA,#7E22CE 55%,#581C87)",
    description: "Recognize a coach who kept the team fired up.",
  },
  "Super Fan": {
    icon: (c = ICON) => <PartyPopper className={`${c} text-pink-300`} strokeWidth={2} />,
    pill: "bg-[#831843]",
    gradient: "linear-gradient(160deg,#DB2777,#BE185D 55%,#831843)",
    description: "Celebrate someone who never misses a game.",
  },
  "Partner Spotlight": {
    icon: (c = ICON) => <BadgeCheck className={`${c} text-yellow-300`} strokeWidth={2} />,
    pill: "bg-[#713F12]",
    gradient: "linear-gradient(160deg,#CA8A04,#A16207 55%,#713F12)",
    description: "Spotlight a sponsor partnership with the team.",
  },
  "Fan Love": {
    icon: (c = ICON) => <PartyPopper className={`${c} text-pink-300`} strokeWidth={2} />,
    pill: "bg-[#1E2A55]",
    gradient: "linear-gradient(160deg,#4F46E5,#4338CA 55%,#312E81)",
    description: "Share the love fans showed for someone on the team.",
  },
  "Thank You": {
    icon: (c = ICON) => <Heart className={`${c} text-sky-300 fill-sky-300`} strokeWidth={2} />,
    pill: "bg-[#1E3A75]",
    gradient: "linear-gradient(160deg,#0284C7,#0369A1 55%,#0C4A6E)",
    description: "Say thank you for support on and off the court.",
  },
  Appreciation: {
    icon: (c = ICON) => <HeartHandshake className={`${c} text-amber-300`} strokeWidth={2} />,
    pill: "bg-[#22305E]",
    gradient: "linear-gradient(160deg,#0F766E,#0E7490 55%,#164E63)",
    description: "Show appreciation for a generous contribution.",
  },
  "Fan Shoutout": {
    icon: (c = ICON) => <Star className={`${c} text-yellow-300 fill-yellow-300`} strokeWidth={2} />,
    pill: "bg-[#22305E]",
    gradient: "linear-gradient(160deg,#2563EB,#4F46E5 55%,#3730A3)",
    description: "Give a shoutout to a standout fan.",
  },
};
