import { Play, ShoppingBag, Ticket, type LucideIcon } from "lucide-react";
import type { SavedSchool } from "@/utils/types/school";

export type LinkTheme = "blue" | "purple" | "teal";

export interface ExternalLinkConfig {
  id: "ticketing" | "streaming" | "store";
  theme: LinkTheme;
  // Header badge icon and its tweak (e.g. tilted ticket, filled play).
  icon: LucideIcon;
  iconClassName: string;
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
  payloadKey: "buyTickets" | "watchGame" | "teamStores";
  // Field the school GET returns the saved link under.
  savedField: keyof SavedSchool;
}

export const EXTERNAL_LINKS: ExternalLinkConfig[] = [
  {
    id: "ticketing",
    theme: "blue",
    icon: Ticket,
    iconClassName: "-rotate-45",
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
    icon: Play,
    iconClassName: "fill-white ml-1",
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
  {
    id: "store",
    theme: "teal",
    icon: ShoppingBag,
    iconClassName: "",
    title: "Team Store",
    description: "Add your T5 Sportswear online store link so fans can buy team apparel and fan wear.",
    info: "This link will be shown on your team pages for fans to shop your official team store.",
    logo: "/images/external-links/t5-sportswear-logo.png",
    logoAlt: "T5 Sportswear",
    label: "T5 Store Link",
    placeholder: "https://www.t5sportswear.com/your-store",
    hint: "Enter your T5 Sportswear online store link.",
    providerName: "T5 Sportswear",
    saveLabel: "Save Store Link",
    // Same feature link the Activations "Team Stores" toggle uses.
    payloadKey: "teamStores",
    savedField: "teamStoresLink",
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
  teal: {
    card: "border-[#1A9BD7]/40 bg-[rgba(20,140,200,0.10)]",
    strip: "bg-[rgba(20,140,200,0.16)]",
    badge: "bg-[radial-gradient(circle_at_30%_30%,#3CC3F2,#0B6FA8)] shadow-[0_0_0_4px_rgba(60,195,242,0.25)]",
    infoBox: "border-[#1A9BD7]/60 bg-[rgba(20,140,200,0.18)]",
    infoIcon: "text-[#4CC4F0]",
  },
} as const;
