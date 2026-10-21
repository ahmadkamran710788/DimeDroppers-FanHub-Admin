import type { Metadata } from "next";
import BrandAssets from "@/components/sponsor/brand-assets";

export const metadata: Metadata = {
  title: "Dime Sponsors · Brand Assets",
};

export default function BrandAssetsPage() {
  return <BrandAssets />;
}
