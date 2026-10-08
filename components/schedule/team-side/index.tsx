import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { cn } from "@/utils/cn";

interface TeamSideProps {
  name: string;
  logoUrl?: string | null;
  // "lg": bigger crest and a name that wraps instead of truncating (game cards).
  size?: "sm" | "lg";
  className?: string;
}

// One side of a matchup: crest (or a placeholder) with the school name under it.
export default function TeamSide({ name, logoUrl, size = "sm", className }: TeamSideProps) {
  const large = size === "lg";
  const crest = large ? "size-16" : "size-12";
  return (
    <div className={cn("w-20 shrink-0 flex flex-col items-center gap-1 min-w-0", large && "gap-2", className)}>
      {logoUrl ? (
        // External logo host, so skip the image optimizer.
        <Image
          src={logoUrl}
          alt=""
          width={large ? 64 : 48}
          height={large ? 64 : 48}
          unoptimized
          className={cn(crest, "rounded-full border border-white/30 object-cover")}
        />
      ) : (
        <div className={cn(crest, "bg-white/20 rounded-full border border-white/30 flex items-center justify-center")}>
          <CalendarDays className="w-6 h-6 text-white/60" strokeWidth={1.5} />
        </div>
      )}
      <span
        title={name}
        className={cn(
          "w-full text-white font-semibold text-center",
          large ? "text-sm sm:text-base leading-tight line-clamp-2" : "text-xs truncate"
        )}
      >
        {name}
      </span>
    </div>
  );
}
