import { ExternalLink } from "lucide-react";
import type { ExternalLinkBlock, FanhubLinkBlock } from "@/utils/types/organiser-agent";

interface LinkBlockProps {
  block: FanhubLinkBlock | ExternalLinkBlock;
}

// A link the agent suggests. A Fan Hub screen lives in the fans' app, so only its name is shown here.
export default function LinkBlock({ block }: LinkBlockProps) {
  if (block.type === "external_link") {
    return (
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-[#b9a6ff] underline underline-offset-2 hover:text-white"
      >
        <ExternalLink className="size-3.5" aria-hidden="true" />
        {block.label}
      </a>
    );
  }
  return <p className="text-sm text-white/70">{`In the Fan Hub app: ${block.label}`}</p>;
}
