import NeedForm from "@/components/organization/fundable-needs/need-form";

export default async function Page({ params }: { params: Promise<{ needId: string }> }) {
  const { needId } = await params;
  return <NeedForm needId={needId} />;
}
