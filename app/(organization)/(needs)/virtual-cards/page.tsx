import VirtualCards from "@/components/organization/virtual-cards";

// `?card=` opens that card (from a need's "Virtual card" link).
export default async function Page({ searchParams }: { searchParams: Promise<{ card?: string | string[] }> }) {
  const { card } = await searchParams;
  return <VirtualCards initialCardId={typeof card === "string" ? card : undefined} />;
}
