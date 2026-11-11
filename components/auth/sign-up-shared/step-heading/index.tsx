interface StepHeadingProps {
  title: string;
  description: string;
}

// Title and one-line description at the top of each sign-up step. The heading takes focus when its
// step opens (tabIndex -1), so keyboard and screen reader users start at the new step.
export default function StepHeading({ title, description }: StepHeadingProps) {
  return (
    <div>
      <h2 tabIndex={-1} className="font-display font-black uppercase text-[40px] md:text-[48px] leading-none outline-none">
        {title}
      </h2>
      <p className="mt-2 text-base text-[#bdbdbd]">{description}</p>
    </div>
  );
}
