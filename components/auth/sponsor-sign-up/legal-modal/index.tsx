"use client";

import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Modal from "@/components/common/modal";
import { CARD, OUTLINE_BUTTON } from "@/components/sponsor/styles";
import type { LegalDocument, LegalSection } from "@/utils/types/sponsor-profile";

const effectiveOn = (date: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(date));

// One numbered section, then its lettered subsections under it.
function Section({ section, nested = false }: { section: LegalSection; nested?: boolean }) {
  return (
    <section className={cn("flex flex-col gap-2", nested && "pl-4 border-l border-[#2a2a2a]")}>
      {nested ? (
        <h4 className="text-[15px] font-semibold text-white">{section.heading}</h4>
      ) : (
        <h3 className="text-base font-bold text-white">{section.heading}</h3>
      )}
      {section.paragraphs.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
      {section.bullets.length > 0 && (
        <ul className="list-disc pl-5 flex flex-col gap-1">
          {section.bullets.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      )}
      {section.subsections?.map((sub, i) => (
        <Section key={i} section={sub} nested />
      ))}
    </section>
  );
}

interface LegalModalProps {
  // null when it couldn't be loaded with the page.
  doc: LegalDocument | null;
  // What the link said, for the title when the document is missing ("Sponsor Terms").
  label: string;
  isOpen: boolean;
  onClose: () => void;
}

// The Sponsor Terms or Privacy Policy, read on the Review step without leaving the wizard.
export default function LegalModal({ doc, label, isOpen, onClose }: LegalModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={cn(CARD, "max-w-[min(720px,calc(100vw-2rem))] max-h-[85vh] items-stretch gap-5 text-white")}
    >
      <div>
        <h2 className="font-display font-black uppercase text-[28px] leading-tight">{doc?.title ?? label}</h2>
        {doc && (
          <p className="text-sm text-[#a8a8a8] mt-1">
            Version {doc.version} · Effective {effectiveOn(doc.effectiveDate)}
          </p>
        )}
      </div>

      <div className="min-h-0 overflow-y-auto flex flex-col gap-5 text-[15px] leading-[1.6] text-[#d4d4d4] pr-1">
        {doc ? (
          doc.sections.map((section, i) => <Section key={i} section={section} />)
        ) : (
          <p>We couldn’t load the {label} right now. Reload the page to try again.</p>
        )}
      </div>

      <Button
        label="Close"
        onClick={onClose}
        className={cn(OUTLINE_BUTTON, "self-end h-11 px-5 rounded-[10px] text-[15px] font-semibold")}
      />
    </Modal>
  );
}
