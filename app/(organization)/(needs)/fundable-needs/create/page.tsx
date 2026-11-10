import NeedForm from "@/components/organization/fundable-needs/need-form";

// `?category=` starts the form on that category (the one filtered on the list).
export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const { category } = await searchParams;
  return <NeedForm initialCategory={typeof category === "string" ? category : undefined} />;
}
