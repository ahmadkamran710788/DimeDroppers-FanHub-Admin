"use client";

import { SetupProvider } from "@/context/setup";

// First-time setup (profile completion) is full-screen: no sidebar or header, just the
// logo above the wizard. After setup the organization is edited from Profile instead.
export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <SetupProvider>
      <div className="relative h-screen bg-black overflow-hidden">
        {/* Blurred ambient background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hub-bg-3c75bf.png"
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            top: 0,
            right: 0,
            width: "80%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top right",
            filter: "blur(72px)",
            opacity: 0.6,
            zIndex: 0,
          }}
        />
        <main className="relative z-10 h-full overflow-y-auto px-4 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-[1280px] flex flex-col gap-8">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/DDLogo.svg" alt="Dime Dropper" width={162} height={32} />
            </div>
            {children}
          </div>
        </main>
      </div>
    </SetupProvider>
  );
}
