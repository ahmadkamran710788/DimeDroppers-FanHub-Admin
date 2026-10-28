import { cn } from "@/utils/cn";
import { FIELD } from "@/components/sponsor/styles";

// Class names shared by the sponsor sign-up steps: the sponsor pages' dark field at the mockup's 52px.

export const INPUT = cn(FIELD, "h-[52px] px-[14px] text-[16px] placeholder:text-[#8a8a8a]");

export const SELECT = cn(FIELD, "h-[52px] px-[14px] text-[16px]");

// The muted "· optional" after a field label.
export const OPTIONAL_HINT = "font-normal tracking-normal text-[#a8a8a8]";
