import Image from "next/image";
import { Users } from "lucide-react";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface ContactAvatarProps {
  name: string;
  src?: string | null;
  // A group chat: a people icon instead of a photo or initials.
  group?: boolean;
}

// 40px round avatar: the member's photo, or their initials when there is none.
export default function ContactAvatar({ name, src, group = false }: ContactAvatarProps) {
  if (group) {
    return (
      <span className="size-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-white">
        <Users className="size-5" strokeWidth={2} />
      </span>
    );
  }
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={40}
        height={40}
        // Fan avatars are presigned S3 URLs, and no remote image host is configured.
        unoptimized={src.startsWith("http")}
        className="size-10 shrink-0 rounded-full object-cover bg-white/10"
      />
    );
  }
  return (
    <span className="size-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold text-white">
      {initials(name)}
    </span>
  );
}
