"use client";

import Button from "@/components/common/button";
import { cn } from "@/utils/cn";

interface WizardFooterProps {
  onBack?: () => void;
  // Label for the left-hand button (e.g. "Cancel" on the Add Team form).
  backLabel?: string;
  onSaveExit?: () => void;
  // Optional so a page can show just Back / Save & Exit (e.g. Schedule → Import Schedule).
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  // Leave room for the 236px desktop sidebar. False on full-screen pages (Setup Wizard).
  withSidebar?: boolean;
}

export default function WizardFooter({
  onBack,
  backLabel = "Back",
  onSaveExit,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  withSidebar = true,
}: WizardFooterProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-20 h-20 flex items-center justify-between px-4 lg:px-10 bg-[rgba(11,28,45,0.01)] backdrop-blur-[48px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]",
        withSidebar && "lg:left-[236px]"
      )}
    >
      {onBack ? <Button variant="ghost" label={backLabel} onClick={onBack} /> : <span />}
      <div className="flex gap-4">
        {onSaveExit && <Button className="cursor-pointer" variant="ghost" label="Save & Exit" onClick={onSaveExit} />}
        {primaryLabel && onPrimary && (
          <Button variant="cta" label={primaryLabel} onClick={onPrimary} disabled={primaryDisabled} />
        )}
      </div>
    </div>
  );
}
