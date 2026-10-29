// Notes store their text as HTML from the RichTextEditor. Older ones are plain text.

const isHtml = (value: string) => /<[a-z][\s\S]*>/i.test(value);

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// HTML for the editor or for display: plain text becomes one paragraph per line.
export const toHtml = (value: string) =>
  isHtml(value)
    ? value
    : value
        .split("\n")
        .map((line) => `<p>${escape(line)}</p>`)
        .join("");

// Plain text for previews (a card's first lines), with a line break per block.
export const htmlToText = (value: string) =>
  isHtml(value)
    ? value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|h[1-6]|li|blockquote)>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .trim()
    : value;
