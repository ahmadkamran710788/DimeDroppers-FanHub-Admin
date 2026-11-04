"use client";

import { User, Users } from "lucide-react";
import Button from "@/components/common/button";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import type { MediaGame } from "@/components/organization/media/data";
import { CARD_COLORS, HEX_COLOR, MESSAGE_MAX, SHOUTOUT_TEMPLATES } from "@/components/organization/recognition/add-recognition/data";
import GameField from "@/components/organization/recognition/add-recognition/game-field";
import SectionHeading from "@/components/organization/recognition/add-recognition/section-heading";
import Selectable from "@/components/organization/recognition/add-recognition/selectable";
import TeamField, { type PickedTeam } from "@/components/organization/recognition/add-recognition/team-field";
import type { GamePerson } from "@/components/organization/recognition/add-recognition/use-game-people";
import { PLAYER_TEMPLATES, type PlayerTemplate } from "@/components/organization/recognition/player-card";
import type { RecognitionTemplate } from "@/components/organization/recognition/recognitions-data";
import { TEMPLATES } from "@/components/organization/recognition/templates";
import { cn } from "@/utils/cn";

export interface CustomizeForm {
  // The game ("Game" template) or, for a tournament's "Profile" template, the team.
  gameId: string;
  teamId: string;
  // A school game's side whose people are listed: "home", "away", or "" until picked.
  side: "" | "home" | "away";
  // The player recognized.
  playerId: string;
  message: string;
  // The staff member or parent giving the recognition.
  giverId: string;
}

interface CustomizeStepProps {
  template: PlayerTemplate;
  isTournament: boolean;
  // The award badge (label and icon on the card); the colours stay the template's.
  badge: RecognitionTemplate;
  onBadge: (t: RecognitionTemplate) => void;
  // The card colour: "" (the template's own), a preset gradient or a hex.
  color: string;
  onColor: (gradient: string) => void;
  onGame: (game: MediaGame) => void;
  onTeam: (team: PickedTeam) => void;
  players: GamePerson[];
  peopleLoading: boolean;
  // Whether the game / team the people come from is picked yet.
  sourceChosen: boolean;
  // Editing: the recognition's game and people, kept unless "Change" is pressed; null when picking them.
  kept: { giver: string; player: string; game: string | null; onChange: () => void } | null;
  // A school game's two teams, to pick whose people to list; null otherwise.
  gameSides: { home: string; away: string } | null;
  form: CustomizeForm;
  errors: Record<string, string>;
  update: <K extends keyof CustomizeForm>(key: K, value: CustomizeForm[K]) => void;
}

const LABEL = "text-white text-sm";
const CARD = "rounded-[10px] border border-white/10 bg-white/[0.04] p-5 lg:p-6 flex flex-col gap-6";
const HEADING = "font-display font-black text-xl uppercase text-white";
const playerLabel = (p: GamePerson) => `${p.number !== undefined ? `#${p.number} ` : ""}${p.name} · ${p.team}`;

// Step 3 of Add Recognition, with the fields the picked template needs (FANHUB_RECOGNITION_TEMPLATES_AND_RULES):
// - "Game" (template 5): the game (a school then picks one of its two teams), then Recognized By and the
//   player from its teams.
// - "Profile" (template 6): no game; the team is picked (a tournament event team or a school team); then
//   Recognized By and the player.
// Both: the award badge and the description.
export default function CustomizeStep({
  template,
  isTournament,
  badge,
  onBadge,
  color,
  onColor,
  onGame,
  onTeam,
  players,
  peopleLoading,
  sourceChosen,
  kept,
  gameSides,
  form,
  errors,
  update,
}: CustomizeStepProps) {
  const usesGame = template !== "Profile";
  const usesTeam = !usesGame;
  const waitingFor = usesGame ? (isTournament ? "Choose the game first" : "Choose the game and team first") : "Choose the team first";

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <section className={CARD}>
        <SectionHeading
          step={3}
          title="Recognition Details"
          description={`Fill in what the "${template}" template shows. The preview on the right updates as you go.`}
        />
        <hr className="border-white/10" />

        {kept ? (
          <div className="rounded-[10px] border border-white/10 bg-white/[0.04] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <dl className="flex-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
              {kept.game && (
                <>
                  <dt className="text-white/60">Game</dt>
                  <dd className="text-white truncate">{kept.game}</dd>
                </>
              )}
              <dt className="text-white/60">Player</dt>
              <dd className="text-white truncate">{kept.player}</dd>
            </dl>
            <Button label="Change" onClick={kept.onChange} className="h-10 min-w-0 px-4 text-sm border border-white/15 bg-white/[0.06] shrink-0" />
          </div>
        ) : (
          <>
        {(usesGame || usesTeam) && (
          <div className="flex flex-col gap-4">
            <h4 className={HEADING}>{usesGame ? "Select a Game" : "Select a Team"}</h4>
            {usesGame ? (
              <>
                <GameField gameId={form.gameId} onGame={onGame} error={errors.gameId} />
                {!isTournament && (
                  <Select
                    variant="dark"
                    label="Team"
                    name="side"
                    required
                    value={form.side}
                    onChange={(e) => update("side", e.target.value as CustomizeForm["side"])}
                    options={gameSides ? [{ label: gameSides.home, value: "home" }, { label: gameSides.away, value: "away" }] : []}
                    placeholder={gameSides ? "Choose a team" : "Choose the game first"}
                    icon={<Users className="size-5" strokeWidth={2} />}
                    disabled={!gameSides}
                    error={errors.side}
                    labelClassName={LABEL}
                  />
                )}
              </>
            ) : (
              <TeamField isTournament={isTournament} teamId={form.teamId} onTeam={onTeam} error={errors.teamId} />
            )}
          </div>
        )}

        {/* The player (Recognized By is the organisation, sent on its own) */}
        <div className="flex flex-col gap-4">
          <h4 className={HEADING}>Select a Player</h4>
          <Select
            variant="dark"
            label="Player"
            name="playerId"
            required
            value={form.playerId}
            onChange={(e) => update("playerId", e.target.value)}
            options={players.map((p) => ({ label: playerLabel(p), value: p.id }))}
            placeholder={
              !sourceChosen
                ? waitingFor
                : peopleLoading
                    ? "Loading…"
                    : players.length
                      ? "Choose a player"
                      : "No players on this team yet"
            }
            icon={<User className="size-5" strokeWidth={2} />}
            disabled={!sourceChosen || peopleLoading || players.length === 0}
            error={errors.playerId || errors.giverId}
            labelClassName={LABEL}
          />
        </div>

          </>
        )}

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

        {/* Card colour */}
        <div className="flex flex-col gap-4">
          <h4 className={HEADING}>Card Color</h4>
          <div className="flex flex-wrap gap-3">
            {CARD_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => onColor(c.gradient)}
                aria-label={c.name === "Template" ? "Template colour" : c.name}
                aria-pressed={c.gradient === color}
                title={c.name}
                className={cn(
                  "size-10 rounded-full ring-2 ring-offset-2 ring-offset-[#0b0b0b] transition",
                  c.gradient === color ? "ring-white" : "ring-transparent hover:ring-white/40"
                )}
                style={{ background: c.gradient || PLAYER_TEMPLATES.find((t) => t.name === template)?.gradient }}
              />
            ))}
            {/* Any colour: the browser's picker, or a hex typed in. */}
            <label
              title="Custom colour"
              className={cn(
                "relative size-10 rounded-full ring-2 ring-offset-2 ring-offset-[#0b0b0b] cursor-pointer overflow-hidden",
                HEX_COLOR.test(color) ? "ring-white" : "ring-transparent hover:ring-white/40"
              )}
              style={{ background: HEX_COLOR.test(color) ? color : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }}
            >
              <input
                type="color"
                aria-label="Custom colour"
                value={HEX_COLOR.test(color) ? color : "#3b82f6"}
                onChange={(e) => onColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <input
              type="text"
              aria-label="Hex colour"
              placeholder="#3B82F6"
              maxLength={7}
              defaultValue={HEX_COLOR.test(color) ? color : ""}
              key={HEX_COLOR.test(color) ? color : "none"}
              onChange={(e) => {
                const v = e.target.value.trim();
                const hex = v.startsWith("#") ? v : `#${v}`;
                if (HEX_COLOR.test(hex)) onColor(hex);
              }}
              className="h-10 w-28 rounded-[10px] border border-white/10 bg-white/[0.06] px-3 text-sm text-white uppercase placeholder:text-white/40 outline-none focus:border-white/30"
            />
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
