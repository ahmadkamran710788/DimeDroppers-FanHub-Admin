import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

// http(s) links only, so nothing but a web page can open.
const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;
// Punctuation that ends a sentence rather than the link ("…book here: https://x.com/a.").
const TRAILING = /[.,;:!?'")\]}]+$/;

interface LinkedTextProps {
  text: string;
  linkClassName?: string;
}

// Plain text with every web address in it turned into a link that opens in a new tab. The text keeps its
// line breaks when the parent has `whitespace-pre-line`.
export default function LinkedText({ text, linkClassName }: LinkedTextProps) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING, "");
    const start = match.index;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <a
        key={start}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("underline underline-offset-2 break-all hover:opacity-80", linkClassName)}
      >
        {url}
      </a>
    );
    last = start + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
