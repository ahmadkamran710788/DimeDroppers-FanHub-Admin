import { cn } from "@/utils/cn";
import { CARD, FIELD } from "@/components/sponsor/styles";

// Class names shared by the Sponsor Profile cards.

// The Sponsor details / Sponsor locations card.
export const PROFILE_CARD = cn(CARD, "rounded-[14px] p-4 sm:p-[26px]");

// A card's title ("SPONSOR DETAILS").
export const CARD_TITLE = "font-display font-black uppercase text-[28px] lg:text-[32px] leading-none";

// Text fields and dropdowns in the edit and new-location forms.
export const INPUT = cn(FIELD, "h-12 px-[14px] text-base placeholder:text-[#8a8a8a]");
export const SELECT = cn(FIELD, "h-12 px-[14px] text-base");

// The 44px Cancel / Save / Replace buttons; callers add the colors.
export const SMALL_BUTTON = "min-w-0 h-11 px-[18px] rounded-[10px] text-[15px] backdrop-blur-none";
