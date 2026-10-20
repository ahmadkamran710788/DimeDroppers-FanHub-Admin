// Numbered heading for each part of the Add Recognition wizard.
export default function SectionHeading({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="size-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg,#8B5CF6,#A855F7)" }}
      >
        {step}
      </span>
      <div className="flex flex-col gap-1 text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-white/75">{description}</p>
      </div>
    </div>
  );
}
