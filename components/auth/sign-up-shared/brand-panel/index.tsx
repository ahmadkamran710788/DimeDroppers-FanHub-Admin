import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { routes } from "@/utils/routes";

interface BrandPanelProps {
  // The brand mark beside the name, from public/ (its own width and height).
  mark: { src: string; width: number; height: number };
  // "DIME SPONSORS", "DIME FAN HUB".
  name: string;
  title: string;
  text: string;
  // What the account offers, each with a tick.
  perks: readonly string[];
  // Before the Sign in link: "Already a sponsor?", "Already have an account?".
  already: string;
}

// Left side of a sign-up (sponsor and organisation): the pitch, what the account offers and the way back
// to sign-in.
export default function BrandPanel({ mark, name, title, text, perks, already }: BrandPanelProps) {
  return (
    <aside className="lg:flex-[1_1_420px] flex flex-col gap-8 lg:gap-10 px-4 py-8 md:px-14 md:py-12 bg-[#0b0a12] border-b lg:border-b-0 lg:border-r border-[#1c1c1c]">
      <div className="flex items-center gap-3">
        <Image src={mark.src} alt="" width={mark.width} height={mark.height} className="shrink-0" />
        <span className="font-display font-black italic text-[38px] leading-none tracking-[0.5px]">{name}</span>
      </div>

      <div className="flex flex-col gap-4 lg:mt-10">
        <h1 className="m-0 font-display font-black uppercase text-[44px] md:text-[72px] leading-[0.95]">{title}</h1>
        <p className="text-base md:text-lg leading-[1.55] text-[#d4d4d4] max-w-[460px]">{text}</p>
      </div>

      <ul className="flex flex-col gap-4">
        {perks.map((perk) => (
          <li key={perk} className="flex gap-[14px] items-start text-base text-[#e5e5e5]">
            <span className="size-8 shrink-0 rounded-[10px] bg-[#2a2148] flex items-center justify-center">
              <Check className="size-4 text-[#d9ccff]" strokeWidth={2.4} aria-hidden />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      <p className="mt-auto text-sm text-[#a8a8a8]">
        {already}{" "}
        <Link href={routes.ui.signIn} className="text-[#c9b8ff] underline hover:text-white">
          Sign in
        </Link>
      </p>
    </aside>
  );
}
