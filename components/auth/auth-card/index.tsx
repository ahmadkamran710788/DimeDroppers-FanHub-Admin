import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

// The design's widths: sign-in, account created, account type.
const WIDTHS = {
  sm: "max-w-[560px]",
  md: "max-w-[620px]",
  lg: "max-w-[820px]",
};

// A link in a card's text ("Create one", "Sign in").
export const AUTH_LINK = "font-medium text-[#8b9bff] underline underline-offset-[3px] hover:text-[#b4c0ff]";

interface AuthCardProps extends HTMLAttributes<HTMLElement> {
  size?: keyof typeof WIDTHS;
}

// The dark card of a centred auth screen (inside AuthShell).
export default function AuthCard({ size = "sm", className, children, ...rest }: AuthCardProps) {
  return (
    <section
      {...rest}
      className={cn(
        "w-full flex flex-col gap-[22px] rounded-[12px] border border-[#22262d] bg-[#0d0f13] p-6 sm:p-10",
        WIDTHS[size],
        className
      )}
    >
      {children}
    </section>
  );
}
