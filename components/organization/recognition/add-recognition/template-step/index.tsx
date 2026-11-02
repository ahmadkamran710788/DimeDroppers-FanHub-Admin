import type { ReactNode } from "react";
import SectionHeading from "@/components/organization/recognition/add-recognition/section-heading";
import Selectable from "@/components/organization/recognition/add-recognition/selectable";
import DonorCard, { DONOR_TEMPLATES, SAMPLE_DONOR, type DonorTemplate } from "@/components/organization/recognition/donor-card";
import PlayerCard, { PLAYER_TEMPLATES, SAMPLE_PLAYER, type PlayerTemplate } from "@/components/organization/recognition/player-card";

// Which group the picked template is from.
export type TemplateKind = "donor" | "player";

interface TemplateStepProps {
  kind: TemplateKind;
  onKind: (k: TemplateKind) => void;
  donorTemplate: DonorTemplate;
  onDonorTemplate: (t: DonorTemplate) => void;
  playerTemplate: PlayerTemplate;
  onPlayerTemplate: (t: PlayerTemplate) => void;
}

const GRID = "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4";

// A template choice: its sample card with the template's name and description under it.
function TemplateTile({
  selected,
  onSelect,
  name,
  description,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  name: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Selectable selected={selected} onSelect={onSelect} className="p-1 flex flex-col gap-3">
      {children}
      <span className="px-2 pb-2 flex flex-col gap-0.5 text-white">
        <span className="text-base font-semibold">{name}</span>
        <span className="text-sm text-white/70">{description}</span>
      </span>
    </Selectable>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-base font-semibold text-white">{title}</h4>
      <div className={GRID}>{children}</div>
    </div>
  );
}

// Step 2 of Add Recognition: the six templates (for now, whoever is recognized), each shown as a sample
// the way fans see it: three donor and three player templates. One is picked across both groups.
export default function TemplateStep({
  kind,
  onKind,
  donorTemplate,
  onDonorTemplate,
  playerTemplate,
  onPlayerTemplate,
}: TemplateStepProps) {
  return (
    <section className="flex flex-col gap-6 min-w-0">
      <SectionHeading
        step={2}
        title="Choose a Template"
        description="Pick the look of your recognition. You'll write the details next."
      />

      <Group title="Donor Templates">
        {DONOR_TEMPLATES.map(({ name, description }) => (
          <TemplateTile
            key={name}
            name={name}
            description={description}
            selected={kind === "donor" && name === donorTemplate}
            onSelect={() => {
              onKind("donor");
              onDonorTemplate(name);
            }}
          >
            <DonorCard template={name} data={SAMPLE_DONOR} />
          </TemplateTile>
        ))}
      </Group>

      <Group title="Player Templates">
        {PLAYER_TEMPLATES.map(({ name, description }) => (
          <TemplateTile
            key={name}
            name={name}
            description={description}
            selected={kind === "player" && name === playerTemplate}
            onSelect={() => {
              onKind("player");
              onPlayerTemplate(name);
            }}
          >
            <PlayerCard template={name} data={SAMPLE_PLAYER} />
          </TemplateTile>
        ))}
      </Group>
    </section>
  );
}
