import RecognitionPage from "@/components/recognition";

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  return <RecognitionPage initialSection={view === "posts" ? "Recognition Posts" : "Fan Wall Photos"} />;
}
