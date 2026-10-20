import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { cn } from "@/utils/cn";
import SponsorShell from "@/components/layout/sponsor-shell";

// The sponsor designs use Bebas Neue and DM Sans. Loaded here, they apply to the sponsor pages only.
const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-dmsans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dime Sponsors",
};

export default function SponsorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(bebasNeue.variable, dmSans.variable)}>
      <SponsorShell>{children}</SponsorShell>
    </div>
  );
}
