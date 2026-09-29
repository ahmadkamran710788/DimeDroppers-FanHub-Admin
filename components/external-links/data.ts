import type { SavedSchool } from "@/utils/types/school";

export type LinkTheme = "blue" | "purple";

export interface ExternalLinkConfig {
  id: "ticketing" | "streaming";
  theme: LinkTheme;
  title: string;
  description: string;
  info: string;
  logo: string;
  logoAlt: string;
  label: string;
  placeholder: string;
  hint: string;
  providerName: string;
  saveLabel: string;
  // Key in the feature-links PATCH payload.
  payloadKey: "buyTickets" | "watchGame";
  // Field the school GET returns the saved link under.
  savedField: keyof SavedSchool;
}

export const EXTERNAL_LINKS: ExternalLinkConfig[] = [
  {
    id: "ticketing",
    theme: "blue",
    title: "Ticketing",
    description: "Add your GoFan link so fans can purchase tickets for your games.",
    info: "This link will be shown on your team and game pages for fans to buy tickets.",
    logo: "/images/external-links/gofan-logo.png",
    logoAlt: "GoFan",
    label: "GoFan Link",
    placeholder: "https://gofan.co/your-organization",
    hint: "Enter your GoFan organization, team or event page link.",
    providerName: "GoFan",
    saveLabel: "Save Ticketing Link",
    payloadKey: "buyTickets",
    savedField: "gofanSchoolPage",
  },
  {
    id: "streaming",
    theme: "purple",
    title: "Streaming",
    description: "Add your NFHS Network link so fans can watch your games live and on-demand.",
    info: "This link will be shown on your team and game pages for fans to watch the games online.",
    logo: "/images/external-links/nfhs-logo.png",
    logoAlt: "NFHS Network",
    label: "NFHS Network Link",
    placeholder: "https://www.nfhsnetwork.com/your-organization",
    hint: "Enter your NFHS Network organization, team or event page link.",
    providerName: "NFHS Network",
    saveLabel: "Save Streaming Link",
    payloadKey: "watchGame",
    savedField: "nfhsNetworkLink",
  },
];

// Per-theme colours for the card, header strip, icon badge and info box.
export const THEME = {
  blue: {
    card: "border-[#3B6FD9]/40 bg-[rgba(38,86,170,0.10)]",
    strip: "bg-[rgba(38,86,170,0.16)]",
    badge: "bg-[radial-gradient(circle_at_30%_30%,#3F8BF0,#1848B8)] shadow-[0_0_0_4px_rgba(63,139,240,0.25)]",
    infoBox: "border-[#3B6FD9]/60 bg-[rgba(38,86,170,0.18)]",
    infoIcon: "text-[#5B8DFF]",
  },
  purple: {
    card: "border-[#7B3FC0]/40 bg-[rgba(110,50,170,0.10)]",
    strip: "bg-[rgba(110,50,170,0.16)]",
    badge: "bg-[radial-gradient(circle_at_30%_30%,#A45BEA,#5E1FA8)] shadow-[0_0_0_4px_rgba(164,91,234,0.25)]",
    infoBox: "border-[#7B3FC0]/60 bg-[rgba(110,50,170,0.18)]",
    infoIcon: "text-[#B57BF0]",
  },
} as const;
