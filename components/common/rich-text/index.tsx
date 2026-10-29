"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/utils/cn";
import { toHtml } from "@/utils/rich-text";

interface RichTextProps {
  // HTML from the RichTextEditor (plain text works too).
  value: string;
  className?: string;
}

// Shows rich text. The HTML is sanitized first, since it comes back from the API.
export default function RichText({ value, className }: RichTextProps) {
  const html = useMemo(() => DOMPurify.sanitize(toHtml(value)), [value]);
  return <div className={cn("rich-text", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
