import { FundableNeedsProvider } from "@/context/fundable-needs";

// Fundable Needs and Virtual Cards share one store of needs (each need has its own card).
export default function NeedsLayout({ children }: { children: React.ReactNode }) {
  return <FundableNeedsProvider>{children}</FundableNeedsProvider>;
}
