import { cn } from "@/utils/cn";

interface OrgMonogramProps {
  initials: string;
  color: string;
  // "lg": 56px, in the organization list. "md": 52px, in the packages panel.
  size?: "md" | "lg";
}

// An organization's initials on its color, standing in for its logo.
export default function OrgMonogram({ initials, color, size = "lg" }: OrgMonogramProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex-none rounded-[12px] flex items-center justify-center font-display font-extrabold text-white leading-none",
        size === "lg" ? "size-14 text-2xl" : "size-[52px] text-[22px]"
      )}
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}
