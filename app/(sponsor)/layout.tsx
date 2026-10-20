import type { Metadata } from "next";
import SponsorShell from "@/components/layout/sponsor-shell";

export const metadata: Metadata = {
  title: "Dime Sponsors",
};

// Sponsor pages use the admin panel's fonts (Inter / Sofia from the root layout).
export default function SponsorLayout({ children }: { children: React.ReactNode }) {
  return <SponsorShell>{children}</SponsorShell>;
}
