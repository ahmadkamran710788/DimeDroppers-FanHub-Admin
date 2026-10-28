import type { Metadata } from "next";
import SponsorProfile from "@/components/sponsor/profile";

export const metadata: Metadata = {
  title: "Dime Sponsors · Sponsor Profile",
};

export default function SponsorProfilePage() {
  return <SponsorProfile />;
}
