"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";

// The tab has long loaded the PDF by then; its object URL is freed after this.
const REVOKE_AFTER_MS = 5 * 60 * 1000;

// The PDF, or the backend's message: 404 when the draft has no packages, 429 after 20 previews a minute.
async function fetchPdf(id: string): Promise<{ blob?: Blob; message?: string }> {
  try {
    const res = await backendFetch(routes.api.sponsorAiPackagePdf(id), {
      headers: { Accept: "application/pdf" },
      cache: "no-store",
    });
    if (res.ok) return { blob: await res.blob() };
    // Errors come back as JSON.
    const json = await res.json().catch(() => null);
    return { message: json?.message || "Couldn't open the package PDF. Try again" };
  } catch {
    return { message: "Please check your network and try again." };
  }
}

// The package PDF a draft's first email carries (GET /drafts/:id/packages-pdf; a conversation's id works
// too), opened in a new tab. The token goes in a header, so the PDF is fetched as a blob. The tab opens
// during the click, as a popup blocker stops one opened after the request, and closes if the PDF fails.
// It takes a second or two: `openingId` is the draft whose PDF is on its way.
export function usePackagePdf() {
  const [openingId, setOpeningId] = useState<string | null>(null);

  const open = useCallback(async (id: string) => {
    const tab = window.open("", "_blank");
    if (!tab) {
      toast.error("Allow pop-ups for this site to open the package PDF");
      return;
    }
    tab.document.title = "Sponsorship Packages";
    tab.document.body?.append("Loading the package PDF…");
    setOpeningId(id);
    const { blob, message } = await fetchPdf(id);
    setOpeningId(null);
    if (!blob) {
      tab.close();
      toast.error(message ?? "Couldn't open the package PDF. Try again");
      return;
    }
    const url = URL.createObjectURL(blob);
    tab.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
  }, []);

  return { open, openingId };
}
