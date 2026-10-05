import RecognitionCard, { type RecognitionCardData } from "@/components/recognition/recognition-card";

interface RecognitionPreviewProps {
  recognition: RecognitionCardData | null;
  title?: string;
  description?: string;
  showTimestamp?: boolean;
}

// Boxed preview of a recognition card (Live Preview / Template Preview).
export default function RecognitionPreview({
  recognition,
  title = "Live Preview",
  description,
  showTimestamp,
}: RecognitionPreviewProps) {
  return (
    <aside className="rounded-[10px] border border-white/10 bg-white/[0.04] p-4 lg:p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-white/75">{description}</p>}
      </div>
      {recognition ? (
        <RecognitionCard data={recognition} showTimestamp={showTimestamp} />
      ) : (
        <p className="py-10 text-center text-sm text-white/50">Select a recognition to preview it.</p>
      )}
    </aside>
  );
}
