import { CircleCheck } from "lucide-react";

interface ReceiptBlockProps {
  summary: string;
}

// The "saved" line after a confirmed change.
export default function ReceiptBlock({ summary }: ReceiptBlockProps) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-[#a3e3a5]">
      <CircleCheck className="size-3.5 shrink-0 mt-px" aria-hidden="true" />
      <span className="break-words">{summary}</span>
    </p>
  );
}
