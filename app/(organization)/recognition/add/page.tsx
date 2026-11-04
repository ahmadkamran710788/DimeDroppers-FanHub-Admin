import AddRecognitionPage from "@/components/organization/recognition/add-recognition";

export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  return <AddRecognitionPage key={edit ?? "new"} editId={edit} />;
}
