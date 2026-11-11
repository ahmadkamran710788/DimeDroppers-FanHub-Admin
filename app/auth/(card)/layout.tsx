import AuthShell from "@/components/auth/auth-shell";

// Sign-in and the account-type chooser: the design's centred screens. Each page draws its own card
// (AuthCard), as their widths differ.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
