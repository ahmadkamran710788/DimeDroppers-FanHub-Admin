import type { Metadata } from "next";
import MySponsorships from "@/components/sponsor/my-sponsorships";

export const metadata: Metadata = {
  title: "Dime Sponsors · My Sponsorships",
};

export default function MySponsorshipsPage() {
  return <MySponsorships />;
}
