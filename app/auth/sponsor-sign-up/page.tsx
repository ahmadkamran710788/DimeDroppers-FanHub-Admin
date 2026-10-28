import type { Metadata } from "next";
import SponsorSignUp from "@/components/auth/sponsor-sign-up";

export const metadata: Metadata = {
  title: "Dime Sponsors · Sign up",
};

export default function SponsorSignUpPage() {
  return <SponsorSignUp />;
}
