"use client";

import { useState } from "react";
import ConfirmModal from "@/components/common/confirm-modal";
import RadioCards from "@/components/common/radio-cards";
import { HINT, SECTION_LABEL } from "@/components/sponsor/styles";
import type { BrandLogos } from "@/components/sponsor/use-brand-logos";
import type { BrandAssetList, MainLogo } from "@/utils/types/sponsor-brand-assets";

interface MainLogoChoiceProps {
  logos: BrandLogos;
}

// The sponsor's main logo (PUT /brand-assets/main-logo): Landscape makes the white logo and icon from the default
// landscape logo; Circular makes nothing. Circular needs a circular logo first, and switching to it asks before the
// made versions are removed.
export default function MainLogoChoice({ logos }: MainLogoChoiceProps) {
  const [confirming, setConfirming] = useState(false);
  const { list, options, mainLogo } = logos;
  if (!list || !options || options.mainLogos.length === 0) return null;

  const hasCircular = list.items.some((a) => a.variant === "CIRCULAR");
  const saving = logos.busy === "main-logo";

  function choose(value: MainLogo) {
    if (value === "CIRCULAR") setConfirming(true);
    else logos.setMainLogo(value);
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div id="main-logo-label" className={SECTION_LABEL}>
        MAIN LOGO
      </div>
      <RadioCards
        options={options.mainLogos.map((o) => ({
          ...o,
          disabled: o.value === "CIRCULAR" && !hasCircular,
        }))}
        value={mainLogo}
        onChange={choose}
        labelledBy="main-logo-label"
        disabled={saving || logos.busy?.startsWith("upload:")}
      />
      {!hasCircular && (
        <p className={HINT}>Add a circular logo to your library to make it your main logo.</p>
      )}

      <ConfirmModal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        title="Make the circular logo your main logo"
        message={circularMessage(list)}
        confirmLabel="Make it main"
        busyLabel="Saving…"
        onConfirm={() => logos.setMainLogo("CIRCULAR")}
      />
    </div>
  );
}

// What switching to the circular logo does: nothing is made any more, the made white logo and icon go, and the
// slots that picked them go back to the next logo.
function circularMessage(list: BrandAssetList) {
  const made = list.items.filter((a) => a.source === "GENERATED");
  const picked = made.reduce((n, a) => n + a.usedBy.slotTypes + a.usedBy.slots, 0);
  const parts = ["Nothing is made from it, so you upload your own white logo and icon."];
  if (made.length) {
    parts.push(
      `Your auto-made ${made.map((a) => a.variantLabel.toLowerCase()).join(" and ")} will be deleted${
        picked ? `, and the ${picked === 1 ? "placement" : `${picked} placements`} that picked them go back to your default` : ""
      }.`
    );
  }
  parts.push("You can switch back to the landscape logo any time; that makes them again.");
  return parts.join(" ");
}
