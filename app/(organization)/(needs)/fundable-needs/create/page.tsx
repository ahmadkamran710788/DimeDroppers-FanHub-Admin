import NeedForm from "@/components/organization/fundable-needs/need-form";

// `?type=` starts the form on that type of need (the one filtered on the list).
export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) {
  const { type } = await searchParams;
  return <NeedForm initialType={typeof type === "string" ? type : undefined} />;
}
