"use client";

import { User, UserStar } from "lucide-react";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import { MESSAGE_MAX, SHOUTOUT_TEMPLATES } from "@/components/organization/recognition/add-recognition/data";
import SectionHeading from "@/components/organization/recognition/add-recognition/section-heading";
import Selectable from "@/components/organization/recognition/add-recognition/selectable";
import type { GamePerson } from "@/components/organization/recognition/add-recognition/use-game-people";
import type { RecognitionTemplate } from "@/components/organization/recognition/recognitions-data";
import { TEMPLATES } from "@/components/organization/recognition/templates";
import { cn } from "@/utils/cn";

export interface CustomizeForm {
  // The player shouted out; empty for a team-wide shout-out.
  playerId: string;
  message: string;
  // The staff member or parent giving the shout-out.
  giverId: string;
}

interface CustomizeStepProps {
  // The award badge (label and icon on the card); the colours stay the template's.
  badge: RecognitionTemplate;
  onBadge: (t: RecognitionTemplate) => void;
  players: GamePerson[];
  givers: GamePerson[];
  peopleLoading: boolean;
  // Players only list once a giver is chosen (their own team's).
  giverChosen: boolean;
  form: CustomizeForm;
  errors: Record<string, string>;
  update: <K extends keyof CustomizeForm>(key: K, value: CustomizeForm[K]) => void;
}

const LABEL = "text-white text-sm";
const CARD = "rounded-[10px] border border-white/10 bg-white/[0.04] p-5 lg:p-6 flex flex-col gap-6";
const HEADING = "font-display font-black text-xl uppercase text-white";
const playerLabel = (p: GamePerson) => `${p.number !== undefined ? `#${p.number} ` : ""}${p.name} · ${p.team}`;
const giverLabel = (p: GamePerson) => `${p.name} · ${p.role} · ${p.team}`;
const loadingOr = (loading: boolean, empty: boolean, placeholder: string, none: string) =>
  loading ? "Loading…" : empty ? none : placeholder;

// Step 3 of Add Recognition, laid out like the fan app's "Post a Shout-Out": a player (optional) and who
// gives it, the award badge and the message.
export default function CustomizeStep({
  badge,
  onBadge,
  players,
  givers,
  peopleLoading,
  giverChosen,
  form,
  errors,
  update,
}: CustomizeStepProps) {

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <section className={CARD}>
        <SectionHeading step={3} title="Post a Shout-Out" description="The preview on the right updates as you type." />
        <hr className="border-white/10" />

        {/* Who gives it, and the player */}
        <div className="flex flex-col gap-4">
          <h4 className={HEADING}>Select a Player</h4>
          <Select
            variant="dark"
            label="Recognized By"
            name="giverId"
            required
            value={form.giverId}
            onChange={(e) => update("giverId", e.target.value)}
            options={givers.map((p) => ({ label: giverLabel(p), value: p.id }))}
            placeholder={loadingOr(peopleLoading, givers.length === 0, "Choose a staff member or parent", "No staff or parents on these teams yet")}
            icon={<UserStar className="size-5" strokeWidth={2} />}
            disabled={peopleLoading || givers.length === 0}
            error={errors.giverId}
            labelClassName={LABEL}
          />
          <Select
            variant="dark"
            label="Player (Optional)"
            name="playerId"
            value={form.playerId}
            onChange={(e) => update("playerId", e.target.value)}
            options={[{ label: "No player", value: "" }, ...players.map((p) => ({ label: playerLabel(p), value: p.id }))]}
            placeholder={
              !giverChosen
                ? "Choose who's giving it first"
                : loadingOr(peopleLoading, players.length === 0, "Choose a player", "No players on this team yet")
            }
            icon={<User className="size-5" strokeWidth={2} />}
            disabled={!giverChosen || peopleLoading || players.length === 0}
            labelClassName={LABEL}
          />
        </div>

        {/* Award badge */}
        <div className="flex flex-col gap-4">
          <h4 className={HEADING}>Award Badge</h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {SHOUTOUT_TEMPLATES.map((t) => (
              <Selectable
                key={t}
                selected={t === badge}
                onSelect={() => onBadge(t)}
                className={cn(
                  "h-14 rounded-[10px] px-4 flex items-center justify-center gap-2 text-base font-medium text-white",
                  t === badge ? "bg-[#3B82F6]/15" : "bg-white/[0.06]"
                )}
              >
                {TEMPLATES[t].icon("size-5 shrink-0")}
                <span className="truncate">{t}</span>
              </Selectable>
            ))}
          </div>
        </div>

        <Textarea
          label="Your Shout-Out"
          name="message"
          required
          fieldVariant="dark"
          labelClassName={LABEL}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Share your words of encouragement..."
          maxLength={MESSAGE_MAX}
          rows={5}
          error={errors.message}
        />
      </section>
    </div>
  );
}
