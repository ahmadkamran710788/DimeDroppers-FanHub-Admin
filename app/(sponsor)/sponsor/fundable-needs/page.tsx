import type { Metadata } from "next";
import FundableNeeds from "@/components/sponsor/fundable-needs";

export const metadata: Metadata = {
  title: "Dime Sponsors · Fundable Needs",
};

export default function FundableNeedsPage() {
  return <FundableNeeds />;
}
