import CardFrame from "@/components/organization/fanhub-ai/card-frame";
import KeyValueList from "@/components/organization/fanhub-ai/key-value-list";
import { templateLabel } from "@/components/organization/fanhub-ai/data";

interface FallbackCardProps {
  template: string;
  data: Record<string, unknown>;
}

// A card of a template this page doesn't know yet (more ship as areas are added): its data as a list.
export default function FallbackCard({ template, data }: FallbackCardProps) {
  return (
    <CardFrame title={templateLabel(template)}>
      <KeyValueList values={data ?? {}} />
    </CardFrame>
  );
}
