import { Users } from "lucide-react";
import Select from "@/components/common/select";
import SectionHeading from "@/components/organization/recognition/add-recognition/section-heading";

export const AUDIENCES = ["Donor", "Sponsor", "Coaches", "Players"] as const;
export type Audience = (typeof AUDIENCES)[number];

interface WhoStepProps {
  audience: Audience | "";
  onAudience: (a: Audience) => void;
  error?: string;
}

// Step 1 of Add Recognition: who the recognition is for.
export default function WhoStep({ audience, onAudience, error }: WhoStepProps) {
  return (
    <section className="rounded-[10px] border border-white/10 bg-white/[0.04] p-5 lg:p-6 flex flex-col gap-6 max-w-[640px]">
      <SectionHeading
        step={1}
        title="Who do you want to recognize?"
        description="Pick who this recognition is for. You'll choose its template next."
      />
      <Select
        variant="dark"
        label="Recognize"
        name="audience"
        required
        value={audience}
        onChange={(e) => onAudience(e.target.value as Audience)}
        options={AUDIENCES.map((a) => ({ label: a, value: a }))}
        placeholder="Choose who to recognize"
        icon={<Users className="size-5" strokeWidth={2} />}
        error={error}
        labelClassName="text-white text-sm"
      />
    </section>
  );
}
