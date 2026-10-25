import Image from "next/image";
import { cn } from "@/utils/cn";

interface OrgMonogramProps {
  initials: string;
  // The organization's logo; its initials stand in without one.
  logoUrl?: string | null;
  // "lg": 56px, in the organization list. "md": 52px, in the packages panel.
  size?: "md" | "lg";
}

// An organization's logo, or its initials on a tile.
export default function OrgMonogram({ initials, logoUrl, size = "lg" }: OrgMonogramProps) {
  const box = size === "lg" ? "size-14" : "size-[52px]";
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={56}
        height={56}
        unoptimized
        className={cn(box, "flex-none rounded-[12px] object-cover bg-white")}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        box,
        "flex-none rounded-[12px] flex items-center justify-center font-display font-extrabold text-white leading-none bg-[#3d5194]",
        size === "lg" ? "text-2xl" : "text-[22px]"
      )}
    >
      {initials}
    </div>
  );
}
