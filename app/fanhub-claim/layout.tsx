import AuthShell from "@/components/auth/auth-shell";

// Public claim/registration flow: the design's centred dark screen with the Dime Fan Hub name above the
// card, shared by the form and its success / failure results.
export default function FanhubClaimLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
