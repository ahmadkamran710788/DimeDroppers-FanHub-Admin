import { TriangleAlert } from "lucide-react";
import CardFrame from "@/components/organization/fanhub-ai/card-frame";
import KeyValueList from "@/components/organization/fanhub-ai/key-value-list";
import { fieldLabel } from "@/components/organization/fanhub-ai/data";
import type { OrgRecordData, OrgRecordPreviewData } from "@/utils/types/organiser-agent";

const ACTION_LABEL: Record<string, string> = {
  create: "To add",
  update: "To change",
  remove: "To remove",
  created: "Added",
  updated: "Saved",
  removed: "Removed",
};

interface RecordCardProps {
  // ORG_RECORD_PREVIEW (what will change, above Confirm / Cancel) or ORG_RECORD (the result).
  data: OrgRecordPreviewData | OrgRecordData;
}

// One record: the fields a change will set, or the record after it.
export default function RecordCard({ data }: RecordCardProps) {
  const preview = "fields" in data;
  const values = (preview ? data.fields : data.record) ?? {};
  const removal = data.action === "remove" || data.action === "removed";
  const title = [data.kind ? fieldLabel(data.kind) : "Record", ACTION_LABEL[data.action] ?? fieldLabel(data.action)].join(" · ");

  return (
    <CardFrame title={title} tone={removal ? "danger" : "default"}>
      <KeyValueList values={values} />
      {preview && data.note && (
        <p className="flex items-start gap-2 rounded-[6px] bg-[#3d2a12] px-3 py-2 text-xs text-[#ffc999]">
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          <span>{data.note}</span>
        </p>
      )}
    </CardFrame>
  );
}
