"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { routes } from "@/utils/routes";
import SponsorSidebar from "@/components/layout/sponsor-sidebar";
import SponsorHeader from "@/components/layout/sponsor-header";
import { SponsorCartProvider } from "@/context/sponsor-cart";

const PAGE_TITLES: Record<string, string> = {
  [routes.ui.sponsor.fundableNeeds]: "Sponsorship",
  [routes.ui.sponsor.sponsorships]: "Sponsorship",
  [routes.ui.sponsor.brandAssets]: "Brand",
  [routes.ui.sponsor.cart]: "Sponsorship",
  [routes.ui.sponsor.profile]: "Profile",
};

// App shell for the sponsor pages: the shared sidebar, the sponsor header and the page area, on the
// admin panel's fonts and base styles. The cart is shared by the header's cart link and every page.
export default function SponsorShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(`${path}/`))?.[1] ??
    "Sponsorship";

  return (
    <SponsorCartProvider>
      <div className="flex h-screen bg-black overflow-hidden">
        <SponsorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <SponsorHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
          {/* Same page padding as the admin pages. */}
          <main className="flex-1 overflow-y-auto px-4 py-4 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>
    </SponsorCartProvider>
  );
}
