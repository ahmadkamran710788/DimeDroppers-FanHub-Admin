import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { routes } from "@/utils/routes";
import { BENEFITS } from "@/components/auth/sponsor-sign-up/data";

// Left side of the sponsor sign-up: the Dime Sponsors pitch and the way back to sign-in.
export default function BrandPanel() {
  return (
    <aside className="lg:flex-[1_1_420px] flex flex-col gap-8 lg:gap-10 px-4 py-8 md:px-14 md:py-12 bg-[#0b0a12] border-b lg:border-b-0 lg:border-r border-[#1c1c1c]">
      <div className="flex items-center gap-3">
        <Image src="/DSLogoMark.svg" alt="" width={44} height={44} className="shrink-0" />
        <span className="font-display font-black italic text-[38px] leading-none tracking-[0.5px]">DIME SPONSORS</span>
      </div>

      <div className="flex flex-col gap-4 lg:mt-10">
        <h1 className="m-0 font-display font-black uppercase text-[44px] md:text-[72px] leading-[0.95]">
          Put your brand where the home team plays
        </h1>
        <p className="text-base md:text-lg leading-[1.55] text-[#d4d4d4] max-w-[460px]">
          Find local organizations, buy sponsorship packages built around their game days, and fund the
          things their teams need.
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex gap-[14px] items-start text-base text-[#e5e5e5]">
            <span className="size-8 shrink-0 rounded-[10px] bg-[#2a2148] flex items-center justify-center">
              <Check className="size-4 text-[#d9ccff]" strokeWidth={2.4} aria-hidden />
            </span>
            {benefit}
          </li>
        ))}
      </ul>

      <p className="mt-auto text-sm text-[#a8a8a8]">
        Already a sponsor?{" "}
        <Link href={routes.ui.signIn} className="text-[#c9b8ff] underline hover:text-white">
          Sign in
        </Link>
      </p>
    </aside>
  );
}
