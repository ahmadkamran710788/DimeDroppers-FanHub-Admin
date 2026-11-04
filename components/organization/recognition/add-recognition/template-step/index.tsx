"use client";

import { useEffect, useState, type ReactNode } from "react";
import SectionHeading from "@/components/organization/recognition/add-recognition/section-heading";
import Selectable from "@/components/organization/recognition/add-recognition/selectable";
import DonorCard, { DONOR_TEMPLATES, SAMPLE_DONOR, type DonorTemplate } from "@/components/organization/recognition/donor-card";
import PlayerCard, { PLAYER_TEMPLATES, SAMPLE_PLAYER, type PlayerTemplate } from "@/components/organization/recognition/player-card";
import { templateKeyOf } from "@/components/organization/recognition/recognition-api";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { Paged, RecognitionTemplateKey, RecognitionWallTemplate } from "@/utils/types/recognition";

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

// Hidden for now: only players are recognized, with templates 5 ("Game") and 6 ("Profile").
const SHOW_DONOR_TEMPLATES = false;
const SHOWN_PLAYER_TEMPLATES: PlayerTemplate[] = ["Game", "Profile"];

const GRID ="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4";

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

// Step 2 of Add Recognition: the templates (for now player templates 5 and 6, whoever is recognized), each shown as a sample
// the way fans see it. One is picked across the groups shown.
export default function TemplateStep({
  kind,
  onKind,
  donorTemplate,
  onDonorTemplate,
  playerTemplate,
  onPlayerTemplate,
}: TemplateStepProps) {
  // The templates the backend offers (GET /recognition-wall-templates?category=PLAYER); until it answers,
  // or if it fails, the panel's own two.
  const [offered, setOffered] = useState<RecognitionTemplateKey[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: Paged<RecognitionWallTemplate>[] }>({
      endpoint: routes.api.recognitionWallTemplates,
      method: "GET",
      data: { category: "PLAYER" },
    }).then((result) => {
      if (!cancelled && result.success) setOffered((result.data?.data?.[0]?.items ?? []).map((t) => t.template));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const isOffered = (name: PlayerTemplate) => {
    const key = templateKeyOf(name);
    return SHOWN_PLAYER_TEMPLATES.includes(name) && (!offered || (!!key && offered.includes(key)));
  };

  return (
    <section className="flex flex-col gap-6 min-w-0">
      <SectionHeading
        step={2}
        title="Choose a Template"
        description="Pick the look of your recognition. You'll write the details next."
      />

      {SHOW_DONOR_TEMPLATES && (
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
      )}

      <Group title="Player Templates">
        {PLAYER_TEMPLATES.filter((t) => isOffered(t.name)).map(({ name, description }) => (
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
