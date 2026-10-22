import Image from "next/image";
import { cn } from "@/utils/cn";

interface TeamAvatarProps {
  name: string;
  // Logo URL; the team's initials are shown when it's empty.
  logo?: string | null;
  // Rendered size in px (the logo's intrinsic size).
  size: number;
  className?: string;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

// A team's round logo, or its initials in a circle when it has none (e.g. tournament teams).
export default function TeamAvatar({ name, logo, size, className }: TeamAvatarProps) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt=""
        width={size}
        height={size}
        unoptimized={logo.startsWith("http")}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "shrink-0 rounded-full bg-[linear-gradient(135deg,#FF34BF,#8B5CF6)] flex items-center justify-center font-display font-extrabold text-white",
        className
      )}
      style={{ fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}
