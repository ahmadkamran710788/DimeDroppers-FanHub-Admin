"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { routes } from "@/utils/routes";
import SponsorSidebar from "@/components/layout/sponsor-sidebar";
import SponsorHeader from "@/components/layout/sponsor-header";

const PAGE_TITLES: Record<string, string> = {
  [routes.ui.sponsor.fundableNeeds]: "Sponsorship",
};

// App shell for the sponsor pages. The sidebar is the shared one; the header and page
// area follow the sponsor designs, which are drawn on browser defaults (line-height
// `normal`, default font smoothing) rather than this app's base styles.
export default function SponsorShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(`${path}/`))?.[1] ??
    "Sponsorship";

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <SponsorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden font-dm-sans leading-[normal] subpixel-antialiased">
        <SponsorHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
