import type { Metadata } from "next";
import FindOrganizations from "@/components/sponsor/find-organizations";

export const metadata: Metadata = {
  title: "Dime Sponsors · Find Organizations",
};

export default function FindOrganizationsPage() {
  return <FindOrganizations />;
}
