import Image from "next/image";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// 40px round avatar: the member's photo, or their initials when there is none.
export default function ContactAvatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return <Image src={src} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover bg-white/10" />;
  }
  return (
    <span className="size-10 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold text-white">
      {initials(name)}
    </span>
  );
}
