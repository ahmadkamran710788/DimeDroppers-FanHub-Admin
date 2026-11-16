import { User } from "lucide-react";
import { cn } from "@/utils/cn";

// The round 48px profile picture in the header and the sidebar footer: the logo when there is one,
// else the plain user icon.
export default function ProfileAvatar({ logoUrl, className }: { logoUrl?: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center",
        // A logo sits on white: most are made for it, and a dark one would vanish on the dark background.
        logoUrl ? "bg-white" : "bg-white/10",
        className
      )}
      style={{ border: "2px solid rgba(255,255,255,0.5)", backdropFilter: "blur(24px)" }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed S3 link
        <img src={logoUrl} alt="" className="size-full object-contain p-1.5" />
      ) : (
        <User className="w-6 h-6 text-white/60" aria-hidden />
      )}
    </span>
  );
}
