import type { Metadata } from "next";
import SponsorCart from "@/components/sponsor/cart";

export const metadata: Metadata = {
  title: "Dime Sponsors · Cart",
};

export default function SponsorCartPage() {
  return <SponsorCart />;
}
