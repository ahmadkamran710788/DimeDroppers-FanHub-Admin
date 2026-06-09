"use client";

import Button from "@/components/common/Button";

interface WizardFooterProps {
  onBack?: () => void;
  onSaveExit?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
}

export default function WizardFooter({
  onBack,
  onSaveExit,
  primaryLabel,
  onPrimary,
  primaryDisabled,
}: WizardFooterProps) {
  return (
    <div className="fixed bottom-0 left-[236px] right-0 h-20 flex items-center justify-between px-10 bg-[rgba(11,28,45,0.01)] backdrop-blur-[48px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
      {onBack ? <Button variant="ghost" label="Back" onClick={onBack} /> : <span />}
      <div className="flex gap-4">
        {onSaveExit && <Button variant="ghost" label="Save & Exit" onClick={onSaveExit} />}
        <Button variant="cta" label={primaryLabel} onClick={onPrimary} disabled={primaryDisabled} />
      </div>
    </div>
  );
}
