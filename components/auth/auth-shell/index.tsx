import type { ReactNode } from "react";

// The centred auth screens (sign-in, account type, account created): the design's near-black page with two
// soft glows, and the Dime Fan Hub name above the card.
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-7 px-4 py-14 bg-[#020305] bg-[image:radial-gradient(900px_700px_at_85%_95%,#1b2026_0%,rgba(27,32,38,0)_60%),radial-gradient(700px_500px_at_10%_0%,#0a0f1a_0%,rgba(10,15,26,0)_70%)]">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/logo-union.svg" alt="" width={34} height={30} className="shrink-0" />
        <span className="font-display font-black text-[32px] uppercase leading-none tracking-wide">
          DIME{" "}
          <span className="bg-[image:var(--gradient-cta)] bg-clip-text text-transparent">FAN HUB</span>
        </span>
      </div>
      {children}
    </div>
  );
}
